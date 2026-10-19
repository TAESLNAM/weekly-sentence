-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run

create table public.entries (
  user_id   uuid not null default auth.uid() references auth.users on delete cascade,
  day       date not null,
  body      text not null check (char_length(body) <= 140),
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.entries enable row level security;

-- 본인 글은 읽기/쓰기/삭제 모두 가능
create policy "own entries" on public.entries
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- is_public = true 인 글만 로그인 없이 읽기 가능 (나중에 공개 링크용)
create policy "public entries are readable" on public.entries
  for select to anon, authenticated
  using (is_public);
