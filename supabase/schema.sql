-- ============================================================
-- PROCESS · Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run 하세요.
-- ============================================================

-- ── 1. 회원 프로필 (auth.users 와 1:1) ──────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  team        text,                       -- 소속 팀/클럽 (선택)
  role        text default 'coach',       -- coach / analyst / admin 등
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.profiles enable row level security;

-- 본인 프로필만 조회/수정
drop policy if exists "본인 프로필 조회" on public.profiles;
create policy "본인 프로필 조회"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "본인 프로필 수정" on public.profiles;
create policy "본인 프로필 수정"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "본인 프로필 삽입" on public.profiles;
create policy "본인 프로필 삽입"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 회원가입 시 프로필 자동 생성 (signUp 의 meta.full_name 사용)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- 이메일/소셜(구글: full_name·name, 카카오: name·nickname) 모두 대응
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'nickname',
      new.raw_user_meta_data ->> 'user_name'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. 저장된 작전판 / 스튜디오 데이터 ──────────────────────
-- 작전판, 훈련 일정, 게임 모델 등을 JSON 으로 저장하는 범용 테이블
create table if not exists public.boards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null default 'board',   -- board | schedule | game_model
  title       text not null default '제목 없음',
  data        jsonb not null default '{}'::jsonb,  -- 스튜디오 상태 직렬화
  thumbnail   text,                                -- 썸네일 URL (선택)
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists boards_user_id_idx on public.boards (user_id);
create index if not exists boards_kind_idx on public.boards (kind);

-- 이름(title) 기준 upsert/덮어쓰기를 위한 유니크 제약.
-- 항목별 저장(배치 play / 세션 session / 내 구성 template)은 같은 이름이면 덮어쓰고,
-- 단일 상태(schedule / matchnotes / match)는 고정 title 로 사용자당 1행을 유지한다.
create unique index if not exists boards_user_kind_title_uidx
  on public.boards (user_id, kind, title);

alter table public.boards enable row level security;

-- 본인 데이터만 CRUD
drop policy if exists "본인 보드 조회" on public.boards;
create policy "본인 보드 조회"
  on public.boards for select
  using (auth.uid() = user_id);

drop policy if exists "본인 보드 생성" on public.boards;
create policy "본인 보드 생성"
  on public.boards for insert
  with check (auth.uid() = user_id);

drop policy if exists "본인 보드 수정" on public.boards;
create policy "본인 보드 수정"
  on public.boards for update
  using (auth.uid() = user_id);

drop policy if exists "본인 보드 삭제" on public.boards;
create policy "본인 보드 삭제"
  on public.boards for delete
  using (auth.uid() = user_id);

-- ── 3. updated_at 자동 갱신 트리거 ──────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists boards_set_updated_at on public.boards;
create trigger boards_set_updated_at
  before update on public.boards
  for each row execute function public.set_updated_at();
