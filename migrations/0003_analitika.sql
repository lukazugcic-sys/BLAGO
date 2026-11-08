-- Anonimni događaji igre. Nema imena, pošte ni sadržaja savea.
create table if not exists blago_dogadaj (
  id bigserial primary key,
  igrac text not null,
  ime text not null,
  t timestamptz not null default now(),
  verzija text not null default '',
  platforma text not null default 'web',
  dan text not null default '',
  broj int,
  ms int,
  rec text
);

create index if not exists blago_dogadaj_dan_idx on blago_dogadaj (dan, ime);
create index if not exists blago_dogadaj_igrac_idx on blago_dogadaj (igrac, ime);
create index if not exists blago_dogadaj_ime_t_idx on blago_dogadaj (ime, t desc);
