/**
 * TableServe — Bulk table setup script
 * 1. Clears all existing orders + tables for the event
 * 2. Creates Table 1–60
 * 3. Generates a printable PDF of QR codes (6 per page)
 * 4. Uploads to S3 and returns a pre-signed download URL
 * 5. Emails the PDF to emmypat4rl@gmail.com via AWS SES
 */

import QRCode    from 'qrcode';
import PDFDocument from 'pdfkit';
import fs          from 'fs';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const SUPABASE_URL  = 'https://sydloyvsptcyhmkfwjdt.supabase.co';
const SERVICE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZGxveXZzcHRjeWhta2Z3amR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzNjQ2NCwiZXhwIjoyMDkwMjEyNDY0fQ.HoDwjkjosEB3ICdHTGkj42Ir87MN3FxtdRAc2mc7YvA';
const APP_URL       = 'https://tableserve-eight.vercel.app';
const S3_BUCKET     = 'wedding-photos-prod-photos-7f964510';
const S3_KEY        = 'tableserve/qr-codes-table1-60.pdf';
const AWS_REGION    = 'eu-west-1';
const EMAIL_TO      = 'emmypat4rl@gmail.com';
const EMAIL_FROM    = 'emmypat4rl@gmail.com';

const headers = {
  apikey:         SERVICE_KEY,
  Authorization:  `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer:         'return=representation',
};

async function supabase(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

// ── 1. Get event ─────────────────────────────────────────────
console.log('Fetching event…');
const events = await supabase('GET', '/events?select=id,name,slug');
if (!events.length) throw new Error('No events found in database');
const event = events[0];
console.log(`  Event: ${event.name} (${event.id})`);

// ── 2. Delete existing orders & tables ───────────────────────
console.log('Deleting existing orders…');
await supabase('DELETE', `/orders?event_id=eq.${event.id}`);
console.log('Deleting existing tables…');
await supabase('DELETE', `/tables?event_id=eq.${event.id}`);

// ── 3. Create 60 tables ──────────────────────────────────────
console.log('Creating 60 tables…');
const tableRows = Array.from({ length: 60 }, (_, i) => ({
  event_id:     event.id,
  table_number: i + 1,
  table_name:   `Table ${i + 1}`,
  seats_count:  8,
  status:       'empty',
}));
const created = await supabase('POST', '/tables', tableRows);
if (!Array.isArray(created)) throw new Error(`Table creation failed: ${JSON.stringify(created)}`);
created.sort((a, b) => a.table_number - b.table_number);
console.log(`  Created ${created.length} tables`);

// ── 4. Generate QR code PNGs in memory ───────────────────────
console.log('Generating QR codes…');
const qrBuffers = await Promise.all(
  created.map(t =>
    QRCode.toBuffer(`${APP_URL}/table/${t.id}`, {
      width: 300,
      margin: 1,
      color: { dark: '#3d0f1a', light: '#ffffff' },
    })
  )
);
console.log(`  Generated ${qrBuffers.length} QR codes`);

// ── 5. Build PDF (6 per page, 2 cols × 3 rows) ───────────────
console.log('Building PDF…');
const PDF_PATH = '/tmp/tableserve-qr-codes.pdf';

await new Promise((resolve, reject) => {
  const doc    = new PDFDocument({ size: 'A4', margin: 30, autoFirstPage: true, bufferPages: true });
  const stream = fs.createWriteStream(PDF_PATH);
  doc.pipe(stream);

  const PAGE_W   = 595.28;
  const PAGE_H   = 841.89;
  const MARGIN   = 30;
  const COLS     = 2;
  const ROWS     = 3;
  const PER_PAGE = COLS * ROWS;
  const CELL_W   = (PAGE_W - MARGIN * 2) / COLS;
  const CELL_H   = (PAGE_H - MARGIN * 2) / ROWS;
  const QR_SIZE  = Math.min(CELL_W, CELL_H) * 0.68;

  created.forEach((table, idx) => {
    const pos  = idx % PER_PAGE;
    const col  = pos % COLS;
    const row  = Math.floor(pos / COLS);

    if (idx > 0 && pos === 0) doc.addPage();

    const cellX = MARGIN + col * CELL_W;
    const cellY = MARGIN + row * CELL_H;
    const qrX   = cellX + (CELL_W - QR_SIZE) / 2;
    const qrY   = cellY + (CELL_H - QR_SIZE) / 2 - 14;

    // Cell border
    doc.rect(cellX + 6, cellY + 6, CELL_W - 12, CELL_H - 12)
       .lineWidth(0.5).strokeColor('#e8c0ca').stroke();

    // QR code
    doc.image(qrBuffers[idx], qrX, qrY, { width: QR_SIZE, height: QR_SIZE });

    // Table label
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#3d0f1a')
       .text(table.table_name, cellX, qrY + QR_SIZE + 10, { width: CELL_W, align: 'center' });

    // Scan instruction
    doc.font('Helvetica').fontSize(9).fillColor('#c4956a')
       .text('Scan to order', cellX, qrY + QR_SIZE + 33, { width: CELL_W, align: 'center' });
  });

  // Page footers
  const totalPages = Math.ceil(created.length / PER_PAGE);
  for (let p = 0; p < totalPages; p++) {
    doc.switchToPage(p);
    doc.font('Helvetica').fontSize(8).fillColor('#aaaaaa')
       .text(
         `Bamai & Kazah — TableServe QR Codes — Page ${p + 1} of ${totalPages}`,
         MARGIN, PAGE_H - MARGIN + 6,
         { width: PAGE_W - MARGIN * 2, align: 'center' }
       );
  }

  doc.end();
  stream.on('finish', resolve);
  stream.on('error', reject);
});
console.log(`  PDF written to ${PDF_PATH}`);

// ── 6. Upload PDF to S3 ──────────────────────────────────────
console.log('Uploading PDF to S3…');
const s3 = new S3Client({ region: AWS_REGION });
const pdfBytes = fs.readFileSync(PDF_PATH);

await s3.send(new PutObjectCommand({
  Bucket:             S3_BUCKET,
  Key:                S3_KEY,
  Body:               pdfBytes,
  ContentType:        'application/pdf',
  ContentDisposition: 'attachment; filename="tableserve-qr-codes.pdf"',
}));

const signedUrl = await getSignedUrl(
  s3,
  new GetObjectCommand({ Bucket: S3_BUCKET, Key: S3_KEY }),
  { expiresIn: 7 * 24 * 60 * 60 }   // 7 days
);

// ── 7. Email PDF to emmypat4rl@gmail.com ─────────────────────
console.log(`Emailing PDF to ${EMAIL_TO}…`);

const tableList = created
  .map(t => `<li style="padding:2px 0;color:#2d1a14;">${t.table_name}</li>`)
  .join('');

const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fdfaf6;font-family:Georgia,serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdfaf6;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#3d0f1a;border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c4956a;">
              Bamai &amp; Kazah · 11 April 2026
            </p>
            <h1 style="margin:0;font-size:28px;font-weight:400;color:#ffffff;line-height:1.2;">
              TableServe QR Codes
            </h1>
            <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.65);">
              Table 1 – 60 &nbsp;·&nbsp; Ready to print
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px;border:1px solid #e8d8cc;border-top:none;">

            <p style="margin:0 0 20px;font-size:16px;color:#2d1a14;line-height:1.7;">
              Hi Emmanuel,
            </p>
            <p style="margin:0 0 20px;font-size:15px;color:#5c3d2e;line-height:1.8;">
              Your QR codes are ready. All previous trial entries have been cleared and
              <strong>60 fresh tables</strong> (Table 1–60) have been created. The
              printable PDF is attached to this email.
            </p>

            <!-- Stats row -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr>
                <td align="center" width="33%" style="padding:16px;background:#fdf6ee;border:1px solid #e8d8cc;border-radius:8px 0 0 8px;">
                  <div style="font-size:28px;font-weight:700;color:#800020;">60</div>
                  <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#c4956a;margin-top:4px;">Tables</div>
                </td>
                <td align="center" width="33%" style="padding:16px;background:#fdf6ee;border:1px solid #e8d8cc;border-left:none;">
                  <div style="font-size:28px;font-weight:700;color:#800020;">60</div>
                  <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#c4956a;margin-top:4px;">QR Codes</div>
                </td>
                <td align="center" width="33%" style="padding:16px;background:#fdf6ee;border:1px solid #e8d8cc;border-left:none;border-radius:0 8px 8px 0;">
                  <div style="font-size:28px;font-weight:700;color:#800020;">10</div>
                  <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#c4956a;margin-top:4px;">Pages</div>
                </td>
              </tr>
            </table>

            <!-- Download link -->
            <div style="background:#fdf6ee;border:1px solid #e8d8cc;border-radius:10px;padding:20px 24px;margin:24px 0;">
              <p style="margin:0 0 10px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#c4956a;font-family:system-ui,sans-serif;">
                Download Link
              </p>
              <p style="margin:0 0 12px;font-size:13px;color:#5c3d2e;line-height:1.6;font-family:system-ui,sans-serif;">
                The PDF is also available via the link below (valid for 7 days):
              </p>
              <a href="${signedUrl}"
                 style="display:inline-block;background:#800020;color:#ffffff;text-decoration:none;
                        padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;
                        font-family:system-ui,sans-serif;">
                Download PDF &rarr;
              </a>
            </div>

            <p style="margin:24px 0 8px;font-size:13px;color:#7a6060;font-family:system-ui,sans-serif;">
              <strong style="color:#2d1a14;">Print tip:</strong> Open the PDF and print at 100% scale on A4 paper.
              Each page contains 6 QR codes (2 columns &times; 3 rows). Cut along the borders and place
              one card on each table before guests arrive.
            </p>

          </td>
        </tr>

        <!-- Table list -->
        <tr>
          <td style="background:#fdfaf6;border:1px solid #e8d8cc;border-top:none;padding:24px 40px;">
            <p style="margin:0 0 12px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#c4956a;font-family:system-ui,sans-serif;">
              Tables Created
            </p>
            <ul style="margin:0;padding:0 0 0 18px;columns:3;column-gap:16px;font-size:13px;font-family:system-ui,sans-serif;">
              ${tableList}
            </ul>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#3d0f1a;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.45);font-family:system-ui,sans-serif;">
              TableServe &nbsp;·&nbsp; Bamai &amp; Kazah Wedding &nbsp;·&nbsp; Epitome Event Center, Kaduna
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
  `;

// Build raw MIME message with PDF attachment
const BOUNDARY = `----TableServeBoundary${Date.now()}`;
const pdfBase64 = pdfBytes.toString('base64');

const rawMessage = [
  `From: TableServe <${EMAIL_FROM}>`,
  `To: ${EMAIL_TO}`,
  `Subject: TableServe QR Codes =?UTF-8?Q?=E2=80=93?= Table 1=E2=80=9360 | Bamai & Kazah Wedding`,
  `MIME-Version: 1.0`,
  `Content-Type: multipart/mixed; boundary="${BOUNDARY}"`,
  ``,
  `--${BOUNDARY}`,
  `Content-Type: text/html; charset=UTF-8`,
  `Content-Transfer-Encoding: quoted-printable`,
  ``,
  htmlBody,
  ``,
  `--${BOUNDARY}`,
  `Content-Type: application/pdf`,
  `Content-Transfer-Encoding: base64`,
  `Content-Disposition: attachment; filename="tableserve-qr-codes.pdf"`,
  ``,
  // Split base64 into 76-char lines (RFC 2045)
  pdfBase64.match(/.{1,76}/g).join('\r\n'),
  ``,
  `--${BOUNDARY}--`,
].join('\r\n');

const sesClient = new SESv2Client({ region: AWS_REGION });
await sesClient.send(new SendEmailCommand({
  Content: { Raw: { Data: Buffer.from(rawMessage) } },
}));

console.log(`  Email sent to ${EMAIL_TO}`);

// ── Done ─────────────────────────────────────────────────────
console.log('\n✅ Done!');
console.log(`\n📄 Download PDF (valid 7 days):\n${signedUrl}\n`);
console.log(`Tables: ${created.map(t => t.table_name).join(', ')}`);
