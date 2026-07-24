-- Run this once in your Supabase project's SQL editor (Database -> SQL Editor -> New query).

create extension if not exists pgcrypto;

create table if not exists links (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  long_url text not null,
  mobile_number text,
  label text,
  created_at timestamptz not null default now()
);

create table if not exists clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references links(id) on delete cascade,
  clicked_at timestamptz not null default now(),
  ip text,
  user_agent text,
  referrer text,
  country text,
  city text
);

create index if not exists idx_links_code on links(code);
create index if not exists idx_links_mobile on links(mobile_number);
create index if not exists idx_clicks_link_id on clicks(link_id);

-- Row Level Security: keep it ON, but since this app only ever talks to
-- Supabase using the SERVICE ROLE key (server-side only), no policies are
-- needed for the app to work. This just blocks any anon/public key access.
alter table links enable row level security;
alter table clicks enable row level security;
