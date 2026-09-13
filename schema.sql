-- Hockey tracker schema for Supabase (Postgres)

create table if not exists players (
  name text primary key,
  number text,
  birth_date date,
  height_cm integer,
  weight_kg integer,
  position text
);

create table if not exists matches (
  id text primary key,
  date date not null,
  label text not null
);

create table if not exists entries (
  id text primary key,
  player text not null references players(name) on update cascade,
  date date not null,
  goals integer not null default 0,
  assists integer not null default 0,
  match_id text references matches(id)
);

create table if not exists goals (
  player text not null references players(name) on update cascade,
  season text not null,
  metric text not null,
  target integer not null,
  primary key (player, season, metric)
);

-- Allow anonymous read/write via the anon key (friend-group app, no auth layer).
alter table players enable row level security;
alter table matches enable row level security;
alter table entries enable row level security;
alter table goals enable row level security;

create policy "public read players" on players for select using (true);
create policy "public write players" on players for all using (true) with check (true);
create policy "public read matches" on matches for select using (true);
create policy "public write matches" on matches for all using (true) with check (true);
create policy "public read entries" on entries for select using (true);
create policy "public write entries" on entries for all using (true) with check (true);
create policy "public read goals" on goals for select using (true);
create policy "public write goals" on goals for all using (true) with check (true);
