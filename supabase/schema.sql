-- =========================================================================
-- KEEP THE PACE — F45 연신내 출석 이벤트
-- Supabase schema
--
-- 이 프로젝트는 완전히 독립된 이벤트 전용 프로젝트입니다.
-- 기존 CRM / 회원관리 시스템과는 전혀 연동하지 않습니다.
--
-- 적용 방법:
--   Supabase 대시보드 → SQL Editor → 새 쿼리 → 이 파일 내용 전체 붙여넣기 → Run
-- =========================================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- events: 이벤트 기간 / 주당 목표 출석 횟수 설정
--   운영 단순화를 위해 "현재 진행 중인 이벤트 1건"만 사용합니다.
--   관리자 설정 화면에서 이 값을 직접 수정합니다.
-- -------------------------------------------------------------------------
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  name         text not null default 'KEEP THE PACE',
  start_date   date not null,
  end_date     date not null,
  weekly_goal  int  not null default 3,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint events_date_order check (end_date >= start_date),
  constraint events_weekly_goal_positive check (weekly_goal between 1 and 6)
);

comment on table public.events is '이벤트 기간 및 주당 목표 출석 횟수. 운영 중에는 1행만 사용.';

-- -------------------------------------------------------------------------
-- members: 참여자 (최소 개인정보만 수집)
-- -------------------------------------------------------------------------
create table if not exists public.members (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  phone_last4  text not null,
  nrc_joined   boolean not null default false,
  nrc_name     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint members_phone_last4_format check (phone_last4 ~ '^[0-9]{4}$'),
  constraint members_name_not_blank check (length(trim(name)) > 0)
);

comment on table public.members is '이벤트 참여자. 이름 + 휴대폰 뒤 4자리로 본인 확인.';

create index if not exists members_name_phone_idx
  on public.members (lower(name), phone_last4);

-- -------------------------------------------------------------------------
-- checkins: 출석 기록
--   같은 회원이 같은 날짜에 중복 출석하지 못하도록 unique 제약.
--   source: 'member' = 본인 QR 체크인, 'admin' = 관리자 수동 추가
-- -------------------------------------------------------------------------
create table if not exists public.checkins (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references public.members(id) on delete cascade,
  checkin_date  date not null,
  source        text not null default 'member' check (source in ('member', 'admin')),
  note          text,
  created_at    timestamptz not null default now(),
  constraint checkins_unique_member_per_day unique (member_id, checkin_date)
);

comment on table public.checkins is '일일 출석 기록. (member_id, checkin_date) 조합은 유일함 → 하루 1회만 인정.';

create index if not exists checkins_date_idx on public.checkins (checkin_date);
create index if not exists checkins_member_idx on public.checkins (member_id);

-- -------------------------------------------------------------------------
-- updated_at 자동 갱신 트리거
-- -------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists members_set_updated_at on public.members;
create trigger members_set_updated_at
  before update on public.members
  for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- Row Level Security
--   이 앱은 브라우저에서 Supabase 테이블에 직접 접근하지 않습니다.
--   모든 읽기/쓰기는 Next.js 서버(API Route)에서 SUPABASE_SERVICE_ROLE_KEY로만
--   수행되며, 서비스 롤 키는 RLS를 우회합니다.
--   따라서 anon/authenticated 권한에는 정책을 부여하지 않고 전체 차단합니다.
--   (관리자 로그인은 Supabase Auth를 사용하되, 실제 테이블 접근은 서버의
--    서비스 롤 키를 통해서만 이루어지고 로그인 세션 자체는 서버에서 검증합니다.)
-- -------------------------------------------------------------------------
alter table public.events   enable row level security;
alter table public.members  enable row level security;
alter table public.checkins enable row level security;

-- -------------------------------------------------------------------------
-- 초기 이벤트 데이터 (필요에 맞게 날짜를 수정하세요. 관리자 화면에서도 수정 가능)
-- -------------------------------------------------------------------------
insert into public.events (name, start_date, end_date, weekly_goal)
select 'KEEP THE PACE', current_date, current_date + interval '27 days', 3
where not exists (select 1 from public.events);
