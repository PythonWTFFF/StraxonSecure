-- Immutable audit trail for SSR server-function-level security events.
-- Append-only by design: no update/delete grants for the application role.
create table if not exists public.audit_log (
  id            bigint generated always as identity primary key,
  occurred_at   timestamptz not null default now(),
  request_id    text not null,
  actor_user_id uuid not null references auth.users(id),
  org_id        uuid not null,
  action        text not null,        -- e.g. 'pentest.launch'
  target        text,                 -- e.g. the scanned URL
  server_fn     text not null,        -- e.g. 'launchPentest'
  ip_address    inet,
  metadata      jsonb not null default '{}'::jsonb
);

alter table public.audit_log enable row level security;

-- read_own_org policy: assumes users have an 'org_id' in their app_metadata or raw_user_meta_data.
-- Note: adjust (auth.jwt() ->> 'org_id')::uuid to your specific token schema.
create policy audit_log_read_own_org
  on public.audit_log for select
  to authenticated
  using (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- inserts happen only through a server-role logging helper (Service Role Key) — never client-writable
revoke update, delete on public.audit_log from authenticated, anon;
revoke insert on public.audit_log from authenticated, anon;
