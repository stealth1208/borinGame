-- Imposter schema
-- Apply in Supabase SQL editor or via CLI: supabase db push

create extension if not exists pgcrypto;

do $$ begin
  create type room_status as enum (
    'LOBBY',
    'ASSIGNING',
    'ROLE_REVEAL',
    'DISCUSSION',
    'VOTING',
    'RESULT',
    'CLOSED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type player_status as enum ('ACTIVE', 'REMOVED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type player_role as enum ('CIVILIAN', 'IMPOSTOR', 'UNDERCOVER', 'MR_WHITE');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type game_mode as enum ('CLASSIC_IMPOSTOR', 'UNDERCOVER');
exception when duplicate_object then null;
end $$;

create table if not exists public.rooms (
  id uuid primary key,
  code text not null unique,
  host_player_id uuid not null,
  status room_status not null default 'LOBBY',
  settings jsonb not null,
  current_round_number integer not null default 0,
  current_round_id uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  host_last_seen_at timestamptz not null default now(),
  constraint rooms_code_format check (code ~ '^[2-9A-HJ-NP-Z]{6}$')
);

create table if not exists public.players (
  id uuid primary key,
  room_id uuid not null references public.rooms(id) on delete cascade,
  nickname text not null,
  session_token text not null unique,
  is_host boolean not null default false,
  status player_status not null default 'ACTIVE',
  joined_at timestamptz not null default now(),
  score integer not null default 0
);

create unique index if not exists players_room_nickname_active
  on public.players (room_id, lower(nickname))
  where status = 'ACTIVE';

create table if not exists public.word_pairs (
  id text primary key,
  category text not null,
  civilian_word text not null,
  undercover_word text not null,
  difficulty text not null,
  language text not null default 'vi',
  active boolean not null default true
);

create table if not exists public.rounds (
  id uuid primary key,
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_number integer not null,
  status room_status not null,
  word_pair_id text not null references public.word_pairs(id),
  speaking_order uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  tie_break text not null default 'NONE',
  unique (room_id, round_number)
);

create table if not exists public.player_assignments (
  id uuid primary key,
  round_id uuid not null references public.rounds(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  role player_role not null,
  word text,
  unique (round_id, player_id)
);

create table if not exists public.votes (
  id uuid primary key,
  round_id uuid not null references public.rounds(id) on delete cascade,
  voter_player_id uuid not null references public.players(id) on delete cascade,
  target_player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (round_id, voter_player_id),
  constraint votes_not_self check (voter_player_id <> target_player_id)
);

alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.rounds enable row level security;
alter table public.player_assignments enable row level security;
alter table public.votes enable row level security;
alter table public.word_pairs enable row level security;

-- No anon/authenticated policies. The Next.js server uses the service role
-- and is the only process that reads session tokens or assignments.
-- Realtime for clients is delivered through /api/rooms/{code}/events (SSE).

do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception when others then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.players;
exception when others then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.rounds;
exception when others then null;
end $$;
