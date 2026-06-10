do $$
begin
  create type public.reviewer_role as enum ('admin', 'reviewer');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.reviewer_status as enum ('active', 'disabled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.reviewer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role public.reviewer_role not null default 'reviewer',
  status public.reviewer_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reviewer_profiles enable row level security;

create table if not exists public.demo_labels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  producer text not null default '',
  category text not null default '',
  summary text not null default '',
  storage_path text not null,
  submitted_fields jsonb not null default '{}'::jsonb,
  sample_field_results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint demo_labels_submitted_fields_object_check
    check (jsonb_typeof(submitted_fields) = 'object'),
  constraint demo_labels_sample_field_results_array_check
    check (jsonb_typeof(sample_field_results) = 'array')
);

alter table public.demo_labels enable row level security;

create or replace function public.handle_new_reviewer_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.reviewer_profiles (
    id,
    email,
    full_name
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1), '')
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_reviewer_profile on auth.users;

create trigger on_auth_user_created_reviewer_profile
after insert on auth.users
for each row execute function public.handle_new_reviewer_profile();

insert into public.reviewer_profiles (
  id,
  email,
  full_name
)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(coalesce(u.email, ''), '@', 1), '')
from auth.users u
on conflict (id) do nothing;

alter table public.label_review_jobs
  add column if not exists source_kind text not null default 'upload',
  add column if not exists demo_label_id uuid references public.demo_labels(id) on delete set null,
  add column if not exists submitted_by uuid references public.reviewer_profiles(id) on delete set null,
  add column if not exists label_title text,
  add column if not exists reviewer_notes text;

do $$
begin
  alter table public.label_review_jobs
    add constraint label_review_jobs_source_kind_check
    check (source_kind in ('upload', 'demo'));
exception
  when duplicate_object then null;
end $$;
