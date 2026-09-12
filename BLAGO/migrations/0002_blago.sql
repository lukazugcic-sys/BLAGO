-- BLAGO cloud save, leaderboard, raids, clans
create table if not exists clans (
  id serial primary key,
  naziv text not null unique,
  owner_id text not null,
  razina int not null default 1,
  xp int not null default 0,
  zadaci jsonb not null default '[]',
  zadnji_refresh timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists player_saves (
  user_id text primary key,
  ime_igraca text not null default 'Igrac',
  igrac_razina int not null default 1,
  prestige_razina int not null default 0,
  ukupno_zlata int not null default 0,
  ukupno_vrtnji int not null default 0,
  zlato int not null default 50,
  dijamanti int not null default 5,
  stitovi int not null default 1,
  drvo int not null default 0,
  kamen int not null default 0,
  zeljezo int not null default 0,
  clan_id int references clans(id) on delete set null,
  save jsonb not null default '{}',
  raid_pending jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create index if not exists player_saves_board_idx
  on player_saves (prestige_razina desc, ukupno_zlata desc);

create index if not exists player_saves_clan_idx on player_saves (clan_id);
