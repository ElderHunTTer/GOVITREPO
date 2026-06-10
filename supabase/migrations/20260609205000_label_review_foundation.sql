create table if not exists public.label_review_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending',
  summary_status text,
  source_image_path text,
  submitted_fields jsonb not null default '{}'::jsonb,
  ocr_provider text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint label_review_jobs_status_check
    check (status in ('pending', 'processing', 'completed', 'failed')),
  constraint label_review_jobs_summary_status_check
    check (
      summary_status is null
      or summary_status in ('pass', 'review', 'fail')
    ),
  constraint label_review_jobs_submitted_fields_object_check
    check (jsonb_typeof(submitted_fields) = 'object')
);

create table if not exists public.label_review_field_results (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.label_review_jobs(id) on delete cascade,
  field_name text not null,
  status text not null,
  expected_value text not null default '',
  detected_value text not null default '',
  confidence numeric(4,3) not null default 0,
  reason text not null default '',
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint label_review_field_results_status_check
    check (status in ('pass', 'review', 'fail')),
  constraint label_review_field_results_confidence_check
    check (confidence >= 0 and confidence <= 1),
  constraint label_review_field_results_evidence_array_check
    check (jsonb_typeof(evidence) = 'array'),
  constraint label_review_field_results_job_field_unique
    unique (job_id, field_name)
);

create index if not exists label_review_jobs_status_created_at_idx
  on public.label_review_jobs (status, created_at desc);

create index if not exists label_review_field_results_job_id_idx
  on public.label_review_field_results (job_id);

alter table public.label_review_jobs enable row level security;
alter table public.label_review_field_results enable row level security;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'label-review-images',
  'label-review-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
