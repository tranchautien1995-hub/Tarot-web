-- Chạy toàn bộ file trong Supabase Dashboard -> SQL Editor.
-- Mỗi ngày được tính theo múi giờ Việt Nam (Asia/Ho_Chi_Minh) và làm mới lúc 00:00.

create table if not exists public.reading_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  preset text not null check (preset in (
    'three', 'six', 'celtic', 'future_love', 'zodiac_houses',
    'health_overview', 'tree_of_life', 'matrix_3x3'
  )),
  used_count integer not null default 0 check (used_count >= 0),
  last_plan text not null check (last_plan in ('free', 'plus', 'pro', 'pro_max')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date, preset)
);

alter table public.reading_daily_usage enable row level security;
revoke all on public.reading_daily_usage from anon, authenticated;

create index if not exists reading_daily_usage_date_idx
  on public.reading_daily_usage(usage_date);

create or replace function public.consume_daily_reading_quota(
  p_user_id uuid,
  p_plan text,
  p_preset text,
  p_limit integer
)
returns table(
  allowed boolean,
  used_count integer,
  remaining_count integer,
  resets_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_usage_date date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_used integer;
  v_resets_at timestamptz := ((v_usage_date + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh');
begin
  if p_limit < 1 then
    raise exception 'Daily limit must be greater than zero';
  end if;

  if p_plan not in ('free', 'plus', 'pro', 'pro_max') then
    raise exception 'Invalid plan';
  end if;

  insert into public.reading_daily_usage (
    user_id, usage_date, preset, used_count, last_plan
  ) values (
    p_user_id, v_usage_date, p_preset, 1, p_plan
  )
  on conflict (user_id, usage_date, preset)
  do update set
    used_count = public.reading_daily_usage.used_count + 1,
    last_plan = excluded.last_plan,
    updated_at = now()
  where public.reading_daily_usage.used_count < p_limit
  returning public.reading_daily_usage.used_count into v_used;

  if v_used is null then
    select usage.used_count into v_used
    from public.reading_daily_usage as usage
    where usage.user_id = p_user_id
      and usage.usage_date = v_usage_date
      and usage.preset = p_preset;

    return query select false, coalesce(v_used, p_limit), 0, v_resets_at;
    return;
  end if;

  return query select true, v_used, greatest(p_limit - v_used, 0), v_resets_at;
end;
$$;

revoke all on function public.consume_daily_reading_quota(uuid, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.consume_daily_reading_quota(uuid, text, text, integer)
  to service_role;

