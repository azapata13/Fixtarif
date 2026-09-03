create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  role public.workspace_role not null default 'member',
  status public.member_status not null default 'invited',
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, email)
);

create index if not exists workspace_invites_workspace_id_idx on public.workspace_invites(workspace_id);
create index if not exists workspace_invites_email_idx on public.workspace_invites(lower(email));

drop trigger if exists workspace_invites_touch_updated_at on public.workspace_invites;
create trigger workspace_invites_touch_updated_at
before update on public.workspace_invites
for each row execute function public.touch_updated_at();

alter table public.workspace_invites enable row level security;

drop policy if exists "Managers can read workspace invites" on public.workspace_invites;
create policy "Managers can read workspace invites"
on public.workspace_invites for select
to authenticated
using (public.can_manage_workspace(workspace_id));

drop policy if exists "Managers can create workspace invites" on public.workspace_invites;
create policy "Managers can create workspace invites"
on public.workspace_invites for insert
to authenticated
with check (
  public.can_manage_workspace(workspace_id)
  and invited_by = auth.uid()
  and status = 'invited'
);

drop policy if exists "Managers can update workspace invites" on public.workspace_invites;
create policy "Managers can update workspace invites"
on public.workspace_invites for update
to authenticated
using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));
