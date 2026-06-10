create table if not exists public.public_report_cases (
  id uuid primary key default gen_random_uuid(),
  case_reference text not null unique,
  status text not null default 'awaiting_label_match',
  reported_label_name text not null default '',
  reported_category text not null default '',
  reporter_email text,
  reporter_notes text not null default '',
  uploaded_image_path text not null,
  matched_demo_label_id uuid references public.demo_labels(id) on delete set null,
  candidate_label_ids jsonb not null default '[]'::jsonb,
  internal_job_id uuid references public.label_review_jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  resolved_at timestamptz,
  constraint public_report_cases_status_check
    check (status in ('awaiting_label_match', 'submitted_for_review', 'in_review', 'resolved')),
  constraint public_report_cases_candidate_label_ids_array_check
    check (jsonb_typeof(candidate_label_ids) = 'array')
);

create index if not exists public_report_cases_case_reference_idx
  on public.public_report_cases (case_reference);

alter table public.public_report_cases enable row level security;

alter table public.label_review_jobs
  add column if not exists public_case_reference text;

alter table public.label_review_jobs
  drop constraint if exists label_review_jobs_source_kind_check;

alter table public.label_review_jobs
  add constraint label_review_jobs_source_kind_check
  check (source_kind in ('upload', 'demo', 'public_report'));
