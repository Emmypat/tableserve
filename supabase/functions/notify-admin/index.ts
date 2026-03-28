import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    const payload = await req.json()
    const { record } = payload

    // Only notify for pending organizers
    if (!record || record.status !== 'pending') {
      return new Response('skipped', { status: 200 })
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://tableserve.vercel.app'
    const resendKey = Deno.env.get('RESEND_API_KEY')

    if (!resendKey) {
      console.error('RESEND_API_KEY not set')
      return new Response('missing key', { status: 500 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TableServe <onboarding@resend.dev>',
        to: ['patkatech@gmail.com'],
        subject: `New TableServe signup — ${record.name}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#1B4332">New organizer signup</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:6px 0;color:#666">Name</td><td style="padding:6px 0;font-weight:600">${record.name}</td></tr>
              <tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0">${record.email}</td></tr>
              <tr><td style="padding:6px 0;color:#666">Phone</td><td style="padding:6px 0">${record.phone || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#666">Signed up</td><td style="padding:6px 0">${new Date(record.created_at).toLocaleString()}</td></tr>
            </table>
            <a href="${appUrl}/admin/approvals"
               style="display:inline-block;margin-top:20px;background:#1B4332;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              Review &amp; Approve →
            </a>
          </div>
        `,
      }),
    })

    const body = await res.json()
    return new Response(JSON.stringify(body), { status: res.ok ? 200 : 500 })
  } catch (err) {
    return new Response(String(err), { status: 500 })
  }
})
