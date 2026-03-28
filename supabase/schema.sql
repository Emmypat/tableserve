-- ============================================================
-- TableServe — Supabase Schema
-- Run this in your Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

-- ── Organizers ────────────────────────────────────────────────
CREATE TABLE organizers (
  id        UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email     TEXT NOT NULL,
  name      TEXT NOT NULL,
  phone     TEXT,
  plan      TEXT DEFAULT 'basic' CHECK (plan IN ('basic', 'standard', 'premium')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Events ────────────────────────────────────────────────────
CREATE TABLE events (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID REFERENCES organizers(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  date         DATE,
  venue        TEXT,
  slug         TEXT UNIQUE NOT NULL,
  status       TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_organizer ON events(organizer_id);

-- ── Menu Items ────────────────────────────────────────────────
CREATE TABLE menu_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id    UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  photo_url   TEXT,
  category    TEXT DEFAULT 'Main' CHECK (category IN ('Starter', 'Main', 'Dessert', 'Drinks')),
  available   BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_items_event ON menu_items(event_id);

-- ── Ushers ────────────────────────────────────────────────────
CREATE TABLE ushers (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id   UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  pin        TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ushers_event_pin ON ushers(event_id, pin);

-- ── Tables ────────────────────────────────────────────────────
CREATE TABLE tables (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id     UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  table_number INTEGER NOT NULL,
  table_name   TEXT,
  seats_count  INTEGER DEFAULT 8,
  usher_id     UUID REFERENCES ushers(id) ON DELETE SET NULL,
  status       TEXT DEFAULT 'empty' CHECK (status IN ('empty', 'ordered', 'served')),
  qr_url       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tables_event ON tables(event_id);

-- ── Orders ────────────────────────────────────────────────────
CREATE TABLE orders (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id         UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  table_id         UUID REFERENCES tables(id) ON DELETE CASCADE NOT NULL,
  usher_id         UUID REFERENCES ushers(id) ON DELETE SET NULL,
  guest_name       TEXT,
  order_type       TEXT DEFAULT 'individual' CHECK (order_type IN ('individual', 'table')),
  items            JSONB NOT NULL DEFAULT '[]',
  special_requests TEXT,
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'served')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  served_at        TIMESTAMPTZ
);

CREATE INDEX idx_orders_event ON orders(event_id, created_at DESC);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_usher ON orders(usher_id);

-- ============================================================
-- REALTIME: Enable on orders and tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE organizers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ushers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;

-- ── organizers ────────────────────────────────────────────────
CREATE POLICY "Organizer owns own record"
  ON organizers FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── events ────────────────────────────────────────────────────
-- Organizer can manage their events
CREATE POLICY "Organizer manages own events"
  ON events FOR ALL
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

-- Anyone can read events (needed for guest URL slug lookup + usher login)
CREATE POLICY "Public can read events"
  ON events FOR SELECT
  TO anon
  USING (true);

-- ── menu_items ────────────────────────────────────────────────
-- Organizer can manage via event ownership
CREATE POLICY "Organizer manages menu items"
  ON menu_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = menu_items.event_id AND events.organizer_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = menu_items.event_id AND events.organizer_id = auth.uid())
  );

-- Guests/ushers can read menu items
CREATE POLICY "Public can read menu items"
  ON menu_items FOR SELECT
  TO anon
  USING (true);

-- ── ushers ────────────────────────────────────────────────────
-- Organizer can manage ushers for their events
CREATE POLICY "Organizer manages ushers"
  ON ushers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = ushers.event_id AND events.organizer_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = ushers.event_id AND events.organizer_id = auth.uid())
  );

-- Anon can read ushers for PIN login
CREATE POLICY "Public can read ushers for PIN login"
  ON ushers FOR SELECT
  TO anon
  USING (true);

-- ── tables ────────────────────────────────────────────────────
-- Organizer can manage tables for their events
CREATE POLICY "Organizer manages tables"
  ON tables FOR ALL
  USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = tables.event_id AND events.organizer_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = tables.event_id AND events.organizer_id = auth.uid())
  );

-- Guests/ushers can read tables
CREATE POLICY "Public can read tables"
  ON tables FOR SELECT
  TO anon
  USING (true);

-- Guests and ushers can update table status (for order placement + mark served)
CREATE POLICY "Public can update table status"
  ON tables FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ── orders ────────────────────────────────────────────────────
-- Organizer can manage orders for their events
CREATE POLICY "Organizer manages orders"
  ON orders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = orders.event_id AND events.organizer_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = orders.event_id AND events.organizer_id = auth.uid())
  );

-- Guests can insert orders
CREATE POLICY "Public can place orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true);

-- Ushers can update orders (mark served) — allowed via anon since ushers have no auth
CREATE POLICY "Public can update order status"
  ON orders FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- STORAGE: Create bucket for menu item photos
-- Run this separately or create via Supabase dashboard
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tableserve', 'tableserve', true);
--
-- CREATE POLICY "Public can read tableserve storage"
--   ON storage.objects FOR SELECT USING (bucket_id = 'tableserve');
--
-- CREATE POLICY "Authenticated can upload to tableserve"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'tableserve');
