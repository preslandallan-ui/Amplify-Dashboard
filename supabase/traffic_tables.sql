-- Traffic Tab: sessions by source per site
create table if not exists traffic_sessions (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,        -- 'eybi' | 'book' | 'course' | 'blueprint'
  source_id text not null,      -- 'ig_organic' | 'ig_paid' | 'google_paid' | 'google_organic' | 'email' | 'direct'
  sessions integer not null default 0,
  date_range text not null default 'Last 30 days',
  updated_at timestamp with time zone default now(),
  unique(site_id, source_id, date_range)
);

-- Traffic Tab: conversions per site
create table if not exists traffic_conversions (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,        -- 'eybi' | 'book' | 'course' | 'blueprint'
  conversion_type text not null, -- e.g. 'Free Sign-up', 'Paid Upgrade', 'Book Purchase' etc
  count integer not null default 0,
  date_range text not null default 'Last 30 days',
  updated_at timestamp with time zone default now(),
  unique(site_id, conversion_type, date_range)
);

-- Enable RLS
alter table traffic_sessions enable row level security;
alter table traffic_conversions enable row level security;

-- Allow all operations (dashboard is internal, no auth layer needed)
create policy "Allow all on traffic_sessions" on traffic_sessions for all using (true) with check (true);
create policy "Allow all on traffic_conversions" on traffic_conversions for all using (true) with check (true);
