# TableServe

**Seamless food service for your event**

A food ordering and table service management platform for weddings and events in Nigeria.

---

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (Auth, PostgreSQL, Real-time, Storage)
- **Hosting**: Vercel
- **QR Codes**: qrcode.react

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in your Supabase URL and anon key

# 3. Run dev server
npm run dev
# → http://localhost:5173
```

---

## Deploying to Vercel

### Step 1 — Push to GitHub

Make sure your code is on GitHub. If not:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/tableserve.git
git push -u origin main
```

### Step 2 — Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New → Project**
3. Find and import your **tableserve** GitHub repository
4. Vercel will auto-detect it as a Vite project — leave build settings as-is (they are set in `vercel.json`)
5. **Before clicking Deploy**, go to the **Environment Variables** section

### Step 3 — Add Environment Variables in Vercel

In the Vercel project settings, add these variables:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://sydloyvsptcyhmkfwjdt.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_APP_URL` | Your Vercel deployment URL (e.g. `https://tableserve.vercel.app`) |

> **Note**: `VITE_APP_URL` is used to generate QR code links for tables.
> Set it to your actual Vercel domain after the first deployment.

### Step 4 — Deploy

Click **Deploy**. Vercel will build and deploy the app in ~1 minute.

### Step 5 — Automatic Deployments

Every `git push` to the `main` branch will automatically trigger a new deployment on Vercel. No manual steps needed.

```bash
# Make changes, then:
git add .
git commit -m "Your changes"
git push
# → Vercel deploys automatically
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `VITE_APP_URL` | ✅ | Your production URL (used in QR codes) |

---

## Database Setup

Run `supabase/schema.sql` in your **Supabase SQL Editor** to create all tables, RLS policies, and enable real-time.

---

## User Flows

### Organizer
1. Sign up at `/signup`
2. Create an event at `/dashboard`
3. Add menu items + photos at `/event/:id/setup`
4. Add tables and generate QR codes at `/event/:id/tables`
5. Add ushers at `/event/:id/ushers`
6. Set event status to **Active**
7. Print QR codes at `/event/:id/qrcodes`
8. Monitor orders live at `/event/:id/orders`

### Usher
1. Go to `/usher/login`
2. Select their event and enter 4-digit PIN
3. Dashboard shows real-time orders for assigned tables
4. Tap **Mark as Served** when food is delivered

### Guest
1. Scan QR code on the table
2. Choose **Individual** or **Table** ordering mode
3. Select items, add special requests, submit

---

## Project Structure

```
src/
├── context/         # Auth + Usher session state
├── hooks/           # useOrders, useTables (real-time)
├── lib/             # Supabase client
├── pages/
│   ├── organizer/   # Dashboard, EventSetup, Tables, Ushers, Orders, QRCodes
│   ├── usher/       # Login, Dashboard
│   └── guest/       # GuestMenu (public)
├── utils/           # Helpers, formatters
└── components/      # Layout, Auth guards
supabase/
└── schema.sql       # Full database schema + RLS policies
```
