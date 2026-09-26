-- Chạy toàn bộ file một lần trong Supabase Dashboard -> SQL Editor.

create table if not exists public.subscription_orders (
  order_code bigint primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('plus', 'pro', 'pro_max')),
  billing_period text not null check (billing_period in ('week', 'month')),
  duration_days integer not null check (duration_days in (7, 30)),
  amount integer not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'failed')),
  payment_code text,
  payment_reference text,
  subscription_expires_at timestamptz,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- Các lệnh ALTER giúp dự án đã chạy bản SQL cũ chuyển sang SePay an toàn.
alter table public.subscription_orders
  add column if not exists payment_code text;

create unique index if not exists subscription_orders_payment_code_uidx
  on public.subscription_orders(payment_code)
  where payment_code is not null;

create unique index if not exists subscription_orders_payment_reference_uidx
  on public.subscription_orders(payment_reference)
  where payment_reference is not null and payment_reference <> '';

alter table public.subscription_orders enable row level security;
revoke all on public.subscription_orders from anon, authenticated;

create index if not exists subscription_orders_user_id_created_at_idx
  on public.subscription_orders(user_id, created_at desc);

create or replace function public.activate_paid_subscription(
  p_order_code bigint,
  p_reference text default ''
)
returns table(activated_plan text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_order public.subscription_orders%rowtype;
  v_metadata jsonb;
  v_current_expiry timestamptz;
  v_base timestamptz;
  v_new_expiry timestamptz;
begin
  select * into v_order
  from public.subscription_orders
  where order_code = p_order_code
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status = 'paid' then
    return query select v_order.plan, v_order.subscription_expires_at;
    return;
  end if;

  select coalesce(raw_app_meta_data, '{}'::jsonb)
  into v_metadata
  from auth.users
  where id = v_order.user_id
  for update;

  if not found then
    raise exception 'User not found';
  end if;

  begin
    v_current_expiry := nullif(v_metadata ->> 'subscription_expires_at', '')::timestamptz;
  exception when others then
    v_current_expiry := null;
  end;

  v_base := case
    when v_current_expiry is not null and v_current_expiry > now() then v_current_expiry
    else now()
  end;
  v_new_expiry := v_base + make_interval(days => v_order.duration_days);

  update auth.users
  set raw_app_meta_data = v_metadata || jsonb_build_object(
    'subscription_plan', v_order.plan,
    'subscription_expires_at', v_new_expiry
  )
  where id = v_order.user_id;

  update public.subscription_orders
  set status = 'paid',
      payment_reference = p_reference,
      paid_at = now(),
      subscription_expires_at = v_new_expiry
  where order_code = p_order_code;

  return query select v_order.plan, v_new_expiry;
end;
$$;

revoke all on function public.activate_paid_subscription(bigint, text) from public, anon, authenticated;
grant execute on function public.activate_paid_subscription(bigint, text) to service_role;

-- Bộ đếm lượt trải bài theo ngày. Thời điểm làm mới: 00:00 giờ Việt Nam.
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
returns table(allowed boolean, used_count integer, remaining_count integer, resets_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_usage_date date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_used integer;
  v_resets_at timestamptz := ((v_usage_date + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh');
begin
  if p_limit < 1 then raise exception 'Daily limit must be greater than zero'; end if;
  if p_plan not in ('free', 'plus', 'pro', 'pro_max') then raise exception 'Invalid plan'; end if;

  insert into public.reading_daily_usage (user_id, usage_date, preset, used_count, last_plan)
  values (p_user_id, v_usage_date, p_preset, 1, p_plan)
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
