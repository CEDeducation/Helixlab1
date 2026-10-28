-- v0.8 hardening: keep this AFTER all three v0.7 migrations.
-- Atomic rate limiting prevents unlimited expensive scientific requests.
create table if not exists public.science_quotas (
 user_id uuid not null references auth.users(id) on delete cascade,
 engine text not null,
 period_start timestamptz not null,
 used integer not null default 0 check(used >= 0),
 primary key(user_id, engine, period_start)
);
alter table public.science_quotas enable row level security;
revoke all on public.science_quotas from public, anon, authenticated;

create or replace function public.consume_science_quota(requested_engine text)
returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid();
declare limit_count int;
declare window_seconds int;
declare period timestamptz;
declare accepted int;
begin
 if uid is null then return false; end if;
 case requested_engine
  when 'dock' then limit_count := 2; window_seconds := 600;
  when 'pharmacophore-ligand' then limit_count := 5; window_seconds := 60;
  when 'pharmacophore-structure' then limit_count := 5; window_seconds := 60;
  when 'primers' then limit_count := 15; window_seconds := 60;
  when 'molecule' then limit_count := 30; window_seconds := 60;
  when 'status' then limit_count := 30; window_seconds := 60;
  else return false;
 end case;
 period := to_timestamp(floor(extract(epoch from now()) / window_seconds) * window_seconds);
 insert into public.science_quotas(user_id,engine,period_start,used)
 values(uid,requested_engine,period,1)
 on conflict(user_id,engine,period_start) do update
 set used=public.science_quotas.used+1
 where public.science_quotas.used < limit_count
 returning used into accepted;
 return accepted is not null;
end $$;
revoke all on function public.consume_science_quota(text) from public, anon;
grant execute on function public.consume_science_quota(text) to authenticated;

-- Remove read access to orphaned private uploads after workspace membership loss.
drop policy if exists helix_storage_read on storage.objects;
create policy helix_storage_read on storage.objects for select to authenticated using (
 bucket_id='research-private' and
 exists(select 1 from public.file_assets f where f.object_path=name
  and public.is_workspace_member(f.workspace_id))
);

-- Attach metadata only to files actually residing in the user's authorized workspace path.
drop policy if exists file_assets_insert on public.file_assets;
create policy file_assets_insert on public.file_assets for insert to authenticated with check(
 public.is_workspace_member(workspace_id,true) and
 uploader_id=(select auth.uid()) and
 split_part(object_path,'/',1)=(select auth.uid())::text and
 split_part(object_path,'/',2)=workspace_id::text and
 (record_id is null or exists(select 1 from public.scientific_records r
  where r.id=record_id and r.workspace_id=workspace_id))
);

-- Retain provenance warnings from simplified browser GenBank imports.
create or replace function public.import_sequence_batch(
 target_workspace uuid, items jsonb, storage_path text,
 original_filename text, original_size int, original_sha256 text
) returns uuid[] language plpgsql security invoker set search_path='' as $$
declare entry jsonb; first_id uuid; ids uuid[] := '{}'; new_id uuid;
begin
 if not public.is_workspace_member(target_workspace,true) then
  raise exception 'Unauthorized sequence import'; end if;
 if jsonb_typeof(items)<>'array' or jsonb_array_length(items) not between 1 and 50 then
  raise exception 'Import must contain 1–50 records'; end if;
 if original_size not between 1 and 5000000 or original_sha256 !~ '^[0-9a-f]{64}$' then
  raise exception 'Invalid original-file evidence'; end if;
 if original_filename !~* '\.(fa|fasta|fna|fas|gb|gbk|genbank|txt|dna)$'
   or char_length(original_filename)>255 then raise exception 'Unsupported filename'; end if;
 if split_part(storage_path,'/',1)<>auth.uid()::text or
   split_part(storage_path,'/',2)<>target_workspace::text then
  raise exception 'Unauthorized storage object path'; end if;
 for entry in select value from jsonb_array_elements(items) loop
  if jsonb_typeof(entry)<>'object' or jsonb_typeof(entry->'sequence')<>'string'
    or jsonb_typeof(entry->'name')<>'string' then
   raise exception 'Malformed sequence item'; end if;
  if jsonb_typeof(entry->'warnings') not in ('array','null') then
   raise exception 'Invalid import warnings'; end if;
  insert into public.scientific_records(workspace_id,name,type,content)
  values(target_workspace, entry->>'name','sequence',jsonb_build_object(
   'sequence',entry->>'sequence','topology',entry->>'topology',
   'features',entry->'features','format',entry->>'format',
   'warnings',coalesce(entry->'warnings','[]'::jsonb)))
  returning id into new_id;
  first_id:=coalesce(first_id,new_id);ids:=array_append(ids,new_id);
 end loop;
 insert into public.file_assets(workspace_id,record_id,uploader_id,object_path,
  filename,mime_type,bytes,sha256)
 values(target_workspace,first_id,auth.uid(),storage_path,original_filename,
  'application/octet-stream',original_size,original_sha256);
 return ids;
end $$;
revoke all on function public.import_sequence_batch(uuid,jsonb,text,text,int,text) from public,anon;
grant execute on function public.import_sequence_batch(uuid,jsonb,text,text,int,text) to authenticated;
