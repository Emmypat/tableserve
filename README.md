# TableServe — Real-Time Event Food Ordering Platform

> A real-time, QR-code-driven table ordering and food service management system for weddings and events. Guests scan a QR code at their table, browse the menu, and place orders that appear instantly on usher and admin dashboards — no app download required.

**Live demo:** [tableserve-eight.vercel.app](https://tableserve-eight.vercel.app)

---

## What It Does

TableServe digitises food service at events. Each table gets a unique QR code. Guests scan it, see the menu, and place orders. Ushers receive orders in real time on their dashboard and mark them served. Admins have full oversight of all tables, orders, and staff.

Built for the Bamai & Kazah wedding (2026) with 60 tables and a multi-course menu, then generalised as a reusable platform for any event organiser.

---

## Features

### Guest Experience
| Feature | Description |
|---------|-------------|
| **QR-Code Ordering** | Each table has a unique QR code; guests scan to access the menu instantly |
| **Menu Browsing** | Categorised menu (Starters, Mains, Desserts, Drinks) with photos and descriptions |
| **Individual & Table Orders** | Guests can order individually or place a combined table order |
| **Special Requests** | Free-text field for dietary notes or custom instructions |
| **No Login Required** | Guests access the ordering interface directly from the QR link — no account, no app |

### Usher Interface
| Feature | Description |
|---------|-------------|
| **PIN Login** | Ushers authenticate with a 4-digit PIN — fast and frictionless for event staff |
| **Real-Time Orders** | New orders appear instantly via Supabase Realtime subscriptions |
| **Mark as Served** | One-tap to mark an order as delivered; table status updates automatically |
| **Audio + Vibration Alerts** | Device-level alerts on new order arrival |

### Admin Dashboard
| Feature | Description |
|---------|-------------|
| **Event Management** | Create and configure events, menus, and ushers |
| **Live Table Overview** | Visual grid of all tables with real-time status (empty / ordered / served) |
| **Order Analytics** | Per-table and per-item order history with timestamps |
| **Usher Management** | Create ushers, assign PINs, track activity |
| **Menu Editor** | Add, edit, and reorder menu items with photo upload to Supabase Storage |
| **QR Code Print Sheet** | Generate and download a printable PDF of all table QR codes (6 per A4 page) |
| **CSV Export** | Export full order history to CSV |
| **Bulk Table Reset** | Clear all orders and regenerate fresh QR codes for a new event in one action |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, Tailwind CSS 3 |
| Database | Supabase (PostgreSQL) |
| Real-time | Supabase Realtime (postgres_changes subscriptions) |
| Auth | Supabase Auth (organiser accounts) + PIN-based (ushers) |
| Storage | Supabase Storage (menu item photos) |
| Email | Resend API via Supabase Edge Function (Deno) |
| QR Generation | qrcode (Node.js) + qrcode.react (browser SVG) |
| PDF Generation | PDFKit (Node.js) |
| Email Delivery | AWS SES v2 (bulk QR PDF delivery) |
| Hosting | Vercel (automatic deploys from GitHub) |
| PWA | vite-plugin-pwa (offline support, installable) |

---

## Architecture

```
                    ┌────────────────────────────┐
                    │  Browser (React 18 + Vite)  │
                    │  Tailwind CSS · PWA enabled  │
                    └───────────┬────────────────┘
                                │
                    ┌───────────▼────────────────┐
                    │         Vercel CDN          │
                    │   (auto-deploy on push)     │
                    └───────────┬────────────────┘
                                │
                    ┌───────────▼────────────────┐
                    │   Supabase (Backend)        │
                    │                            │
                    │  ┌─────────────────────┐   │
                    │  │  PostgreSQL DB       │   │
                    │  │  ┌───────┐ ┌──────┐ │   │
                    │  │  │tables │ │orders│ │   │
                    │  │  │ushers │ │menus │ │   │
                    │  │  └───────┘ └──────┘ │   │
                    │  └─────────────────────┘   │
                    │                            │
                    │  ┌─────────────────────┐   │
                    │  │  Realtime Engine     │   │
                    │  │  (WebSocket push)    │   │
                    │  └─────────────────────┘   │
                    │                            │
                    │  ┌─────────────────────┐   │
                    │  │  Edge Functions      │   │
                    │  │  (Deno — Resend API) │   │
                    │  └─────────────────────┘   │
                    │                            │
                    │  ┌─────────────────────┐   │
                    │  │  Storage             │   │
                    │  │  (menu photos)       │   │
                    │  └─────────────────────┘   │
                    └────────────────────────────┘

Real-time data flow:
  Guest places order → INSERT into orders table
    → Supabase Realtime fires postgres_changes event
      → Usher and Admin dashboards update instantly (no polling)
```

---

## Database Schema

```sql
events       — organiser-owned event records (name, date, venue, slug)
menu_items   — food items per event (name, category, photo_url, available)
ushers       — event staff with 4-digit PINs
tables       — per-table records with QR URLs and status (empty/ordered/served)
orders       — guest orders (items: JSONB, status: pending/served, timestamps)
```

Row-Level Security (RLS) is enforced on all tables — organisers can only access their own events; guests can only read menus and insert orders for their specific table.

---

## QR Code Generation & Distribution

A Node.js CLI script handles bulk table setup and QR code delivery:

```bash
node scripts/setup-tables.mjs
```

What it does:
1. Clears all existing orders and tables for the event
2. Creates 60 fresh tables (Table 1–60) in Supabase
3. Generates 60 QR code PNGs in memory (300px, branded burgundy)
4. Builds a print-ready A4 PDF (6 codes per page, 10 pages)
5. Uploads the PDF to AWS S3 with a 7-day pre-signed download URL
6. Emails the PDF with attachment to the organiser via AWS SES v2

---

## Local Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Add your Supabase URL, anon key, and app URL

# Run the database schema
# Paste supabase/schema.sql into the Supabase SQL Editor

# Start dev server
npm run dev
```

---

## Project Structure

```
├── src/
│   ├── pages/
│   │   ├── Landing.jsx          # Public landing page
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx    # Full admin interface (tables, orders, menus, ushers)
│   │   │   └── Login.jsx
│   │   ├── usher/
│   │   │   ├── UsherLogin.jsx   # PIN-based login
│   │   │   └── UsherDashboard.jsx
│   │   └── guest/
│   │       └── GuestMenu.jsx    # QR-linked ordering interface
│   ├── hooks/
│   │   ├── useOrders.js         # Realtime orders subscription
│   │   └── useTables.js         # Realtime tables subscription
│   ├── context/
│   │   ├── AuthContext.jsx      # Organiser auth state
│   │   └── UsherContext.jsx     # Usher session state
│   └── lib/
│       └── supabase.js          # Supabase client
├── supabase/
│   ├── schema.sql               # Full DB schema + RLS policies
│   ├── seed.sql                 # Test event with menu and tables
│   └── functions/
│       └── notify-admin/        # Deno edge function (Resend email)
└── scripts/
    └── setup-tables.mjs         # Bulk QR generation + S3 upload + SES email
```

---

## Highlights

- **Real-time without polling** — all dashboards update instantly using Supabase Realtime WebSocket subscriptions; no `setInterval`, no page refreshes
- **Zero-friction guest flow** — guests need only a phone camera; no account, no app, no friction
- **PWA** — installable on iOS and Android; works offline for menu browsing
- **Automated QR delivery pipeline** — one command resets all tables, generates 60 QR codes, builds a 10-page print-ready PDF, and emails it as an attachment via SES
- **Row-Level Security** — all Supabase tables are protected by RLS policies; data isolation is enforced at the database layer, not just the application layer
- **Production-tested** — deployed for 60 tables at the Bamai & Kazah wedding, April 2026

---

## Author

Built by **Yerima Shettima** · [GitHub @Emmypat](https://github.com/Emmypat)
