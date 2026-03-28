-- ============================================================
-- TableServe Seed — Bamai & Kazah Wedding, 11 April 2026
-- Run this in the Supabase SQL Editor after applying schema.sql
-- ============================================================

-- 1. Event
INSERT INTO events (id, name, slug, date, venue, status)
VALUES (
  'bamai-kazah-2026',
  'Bamai & Kazah Wedding',
  'bamai-kazah',
  '2026-04-11',
  'Epitome Event Center, Barnawa Kaduna',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Menu Items
INSERT INTO menu_items (event_id, name, description, category, available, sort_order)
VALUES
  -- Starters
  ('bamai-kazah-2026', 'Pepper Soup',        'Spiced Nigerian pepper soup',               'Starter', true, 1),
  ('bamai-kazah-2026', 'Asun',               'Spicy grilled goat meat',                   'Starter', true, 2),
  ('bamai-kazah-2026', 'Spring Rolls',       'Crispy vegetable spring rolls',             'Starter', true, 3),

  -- Mains
  ('bamai-kazah-2026', 'Jollof Rice',        'Party jollof with chicken & fried plantain','Main',    true, 4),
  ('bamai-kazah-2026', 'Fried Rice',         'Nigerian fried rice with coleslaw',         'Main',    true, 5),
  ('bamai-kazah-2026', 'Pounded Yam & Egusi','Traditional pounded yam with egusi soup',  'Main',    true, 6),
  ('bamai-kazah-2026', 'Small Chops Platter','Samosa, puff puff & mini sausage rolls',   'Main',    true, 7),
  ('bamai-kazah-2026', 'Grilled Fish',       'Whole tilapia with spiced tomato sauce',   'Main',    true, 8),

  -- Desserts
  ('bamai-kazah-2026', 'Wedding Cake',       'A slice of the celebration cake',           'Dessert', true, 9),
  ('bamai-kazah-2026', 'Puff Puff',          'Sweet fried dough, served warm',            'Dessert', true, 10),

  -- Drinks
  ('bamai-kazah-2026', 'Zobo Drink',         'Hibiscus flower drink, chilled',            'Drinks',  true, 11),
  ('bamai-kazah-2026', 'Chapman',            'Classic Nigerian cocktail',                 'Drinks',  true, 12),
  ('bamai-kazah-2026', 'Water',              'Still or sparkling',                        'Drinks',  true, 13),
  ('bamai-kazah-2026', 'Soft Drinks',        'Choice of Coke, Fanta or Sprite',           'Drinks',  true, 14)
ON CONFLICT DO NOTHING;

-- 3. Ushers (PINs: 1001–1005)
INSERT INTO ushers (event_id, name, pin)
VALUES
  ('bamai-kazah-2026', 'Usher A', '1001'),
  ('bamai-kazah-2026', 'Usher B', '1002'),
  ('bamai-kazah-2026', 'Usher C', '1003'),
  ('bamai-kazah-2026', 'Usher D', '1004'),
  ('bamai-kazah-2026', 'Usher E', '1005')
ON CONFLICT DO NOTHING;

-- 4. Tables (10 tables, round-robin usher assignment)
--    Ushers are assigned after insert since we don't know their UUIDs up front.
--    Run the INSERT, then run the UPDATE below separately if needed.
INSERT INTO tables (event_id, table_number, table_name, seats_count, status)
VALUES
  ('bamai-kazah-2026', 1,  'Table 1',  10, 'available'),
  ('bamai-kazah-2026', 2,  'Table 2',  10, 'available'),
  ('bamai-kazah-2026', 3,  'Table 3',  10, 'available'),
  ('bamai-kazah-2026', 4,  'Table 4',  10, 'available'),
  ('bamai-kazah-2026', 5,  'Table 5',  10, 'available'),
  ('bamai-kazah-2026', 6,  'Table 6',  10, 'available'),
  ('bamai-kazah-2026', 7,  'Table 7',  10, 'available'),
  ('bamai-kazah-2026', 8,  'Table 8',  10, 'available'),
  ('bamai-kazah-2026', 9,  'Table 9',  10, 'available'),
  ('bamai-kazah-2026', 10, 'Table 10', 10, 'available')
ON CONFLICT DO NOTHING;

-- 5. Assign ushers to tables (round-robin)
--    Run this after the inserts above.
WITH usher_list AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) AS rn
  FROM ushers WHERE event_id = 'bamai-kazah-2026'
),
table_list AS (
  SELECT id, table_number
  FROM tables WHERE event_id = 'bamai-kazah-2026'
)
UPDATE tables t
SET usher_id = (
  SELECT u.id FROM usher_list u
  WHERE u.rn = ((tl.table_number - 1) % (SELECT COUNT(*) FROM usher_list) + 1)
  FROM table_list tl WHERE tl.id = t.id
)
WHERE event_id = 'bamai-kazah-2026';
