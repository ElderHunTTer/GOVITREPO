alter table public.public_report_cases
  add column if not exists bot_check_verified boolean not null default false,
  add column if not exists classification_status text,
  add column if not exists classification_confidence numeric,
  add column if not exists review_confidence numeric,
  add column if not exists ai_provider text,
  add column if not exists ai_model text,
  add column if not exists ai_summary text,
  add column if not exists auto_rejection_reason text,
  add column if not exists extracted_fields jsonb not null default '{}'::jsonb,
  add column if not exists extraction_confidences jsonb not null default '{}'::jsonb,
  add column if not exists ai_processed_at timestamp with time zone;

alter table public.public_report_cases
  drop constraint if exists public_report_cases_status_check;

update public.public_report_cases
set status = case
  when status = 'awaiting_label_match' then 'processing'
  when status = 'submitted_for_review' then 'pending_review'
  else status
end;

alter table public.public_report_cases
  alter column status set default 'processing';

alter table public.public_report_cases
  add constraint public_report_cases_status_check
  check (
    status = any (
      array[
        'processing'::text,
        'auto_rejected'::text,
        'pending_review'::text,
        'in_review'::text,
        'resolved'::text
      ]
    )
  );

alter table public.public_report_cases
  drop constraint if exists public_report_cases_classification_status_check;

alter table public.public_report_cases
  add constraint public_report_cases_classification_status_check
  check (
    classification_status is null
    or classification_status = any (
      array[
        'ttb_label'::text,
        'not_ttb_label'::text,
        'uncertain'::text
      ]
    )
  );

alter table public.public_report_cases
  drop constraint if exists public_report_cases_classification_confidence_check;

alter table public.public_report_cases
  add constraint public_report_cases_classification_confidence_check
  check (
    classification_confidence is null
    or (
      classification_confidence >= 0::numeric
      and classification_confidence <= 1::numeric
    )
  );

alter table public.public_report_cases
  drop constraint if exists public_report_cases_review_confidence_check;

alter table public.public_report_cases
  add constraint public_report_cases_review_confidence_check
  check (
    review_confidence is null
    or (
      review_confidence >= 0::numeric
      and review_confidence <= 1::numeric
    )
  );

alter table public.public_report_cases
  drop constraint if exists public_report_cases_extracted_fields_check;

alter table public.public_report_cases
  add constraint public_report_cases_extracted_fields_check
  check (jsonb_typeof(extracted_fields) = 'object'::text);

alter table public.public_report_cases
  drop constraint if exists public_report_cases_extraction_confidences_check;

alter table public.public_report_cases
  add constraint public_report_cases_extraction_confidences_check
  check (jsonb_typeof(extraction_confidences) = 'object'::text);

alter table public.label_review_jobs
  add column if not exists automated_classification text,
  add column if not exists automated_confidence numeric,
  add column if not exists automated_summary text,
  add column if not exists automated_model text,
  add column if not exists review_decision text,
  add column if not exists reviewed_by uuid,
  add column if not exists reviewed_at timestamp with time zone;

alter table public.label_review_jobs
  drop constraint if exists label_review_jobs_automated_classification_check;

alter table public.label_review_jobs
  add constraint label_review_jobs_automated_classification_check
  check (
    automated_classification is null
    or automated_classification = any (
      array[
        'ttb_label'::text,
        'not_ttb_label'::text,
        'uncertain'::text
      ]
    )
  );

alter table public.label_review_jobs
  drop constraint if exists label_review_jobs_automated_confidence_check;

alter table public.label_review_jobs
  add constraint label_review_jobs_automated_confidence_check
  check (
    automated_confidence is null
    or (
      automated_confidence >= 0::numeric
      and automated_confidence <= 1::numeric
    )
  );

alter table public.label_review_jobs
  drop constraint if exists label_review_jobs_review_decision_check;

alter table public.label_review_jobs
  add constraint label_review_jobs_review_decision_check
  check (
    review_decision is null
    or review_decision = any (
      array[
        'accepted'::text,
        'denied'::text,
        'second_opinion'::text
      ]
    )
  );

alter table public.label_review_jobs
  drop constraint if exists label_review_jobs_reviewed_by_fkey;

alter table public.label_review_jobs
  add constraint label_review_jobs_reviewed_by_fkey
  foreign key (reviewed_by) references public.reviewer_profiles(id);
