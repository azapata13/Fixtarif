create or replace function public.accept_pending_workspace_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  accepted_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  select invite.workspace_id, auth.uid(), invite.role, 'active'
  from public.workspace_invites invite
  where lower(invite.email) = lower(coalesce(auth.email(), ''))
    and invite.status = 'invited'
    and invite.expires_at > now()
  on conflict (workspace_id, user_id)
  do update set
    role = excluded.role,
    status = 'active';

  get diagnostics accepted_count = row_count;

  update public.workspace_invites invite
  set
    status = 'active',
    accepted_by = auth.uid(),
    accepted_at = now()
  where lower(invite.email) = lower(coalesce(auth.email(), ''))
    and invite.status = 'invited'
    and invite.expires_at > now();

  return accepted_count;
end;
$$;

revoke all on function public.accept_pending_workspace_invites() from public;
grant execute on function public.accept_pending_workspace_invites() to authenticated;
