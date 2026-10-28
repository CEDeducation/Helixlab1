-- HelixLab v0.8.1: recover users registered BEFORE helix_create_workspace was installed.
-- Safe to run repeatedly after the v0.8 migration set in a Supabase SQL Editor.
-- Run as a database administrator (SQL Editor), not via the browser client.
-- The signup trigger only initializes NEW auth.users rows; preexisting users
-- otherwise encounter "No workspace found" at login.
insert into public.workspaces (owner_id, name)
select u.id, 'My Research Lab'
from auth.users u
where not exists (select 1 from public.workspaces w where w.owner_id=u.id)
on conflict (owner_id) do nothing;

insert into public.workspace_members (workspace_id, user_id, role)
select w.id, w.owner_id, 'owner'
from public.workspaces w
where not exists (
 select 1 from public.workspace_members m
 where m.workspace_id=w.id and m.user_id=w.owner_id
)
on conflict (workspace_id, user_id) do nothing;

insert into public.student_profiles (workspace_id, slot, display_name, color)
select w.id, 1, 'Researcher 1', '#6374c6'
from public.workspaces w
where not exists (
 select 1 from public.student_profiles p where p.workspace_id=w.id
)
on conflict (workspace_id, slot) do nothing;
