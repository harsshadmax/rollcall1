-- Let a signed-in user delete their own account. Removing their auth.users row
-- cascades to every user-owned table (all FKs are "on delete cascade").
create or replace function delete_user()
returns void
language sql
security definer
set search_path = public, auth
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function delete_user() from public;
grant execute on function delete_user() to authenticated;
