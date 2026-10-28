-- v0.7.1: Create a complete multi-record import in one database transaction.
-- Run this migration AFTER the v0.7 schema and policies; it is additive.
create or replace function public.import_sequence_batch(
  target_workspace uuid, items jsonb, storage_path text,
  original_filename text, original_size int, original_sha256 text
) returns uuid[]
language plpgsql security invoker set search_path='' as $$
declare entry jsonb; first_id uuid; ids uuid[] := '{}'; new_id uuid;
begin
 if not public.is_workspace_member(target_workspace,true) then
  raise exception 'Unauthorized sequence import'; end if;
 if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) not between 1 and 50 then
  raise exception 'Import must contain 1 to 50 records'; end if;
 if original_size not between 1 and 5000000 or original_sha256 !~ '^[0-9a-f]{64}$' then
  raise exception 'Invalid source file evidence'; end if;
 if original_filename !~* '\.(fa|fasta|fna|fas|gb|gbk|genbank|txt|dna)$'
    or char_length(original_filename) > 255 then
  raise exception 'Unsupported source filename'; end if;
 if split_part(storage_path,'/',1) <> auth.uid()::text
    or split_part(storage_path,'/',2) <> target_workspace::text then
  raise exception 'Invalid source storage path'; end if;
 for entry in select value from jsonb_array_elements(items) loop
  if jsonb_typeof(entry) <> 'object' or
     jsonb_typeof(entry->'sequence') <> 'string' or
     jsonb_typeof(entry->'name') <> 'string' then
    raise exception 'Malformed imported sequence'; end if;
  insert into public.scientific_records (workspace_id,name,type,content)
  values(target_workspace, entry->>'name', 'sequence',
    jsonb_build_object('sequence',entry->>'sequence',
      'topology',entry->>'topology','features',entry->'features',
      'format',entry->>'format')) returning id into new_id;
  first_id := coalesce(first_id,new_id);
  ids := array_append(ids,new_id);
 end loop;
 insert into public.file_assets(workspace_id,record_id,uploader_id,object_path,
   filename,mime_type,bytes,sha256)
 values(target_workspace,first_id,auth.uid(),storage_path,
   original_filename,'application/octet-stream',original_size,original_sha256);
 return ids;
end $$;
revoke all on function public.import_sequence_batch(uuid,jsonb,text,text,int,text) from public;
grant execute on function public.import_sequence_batch(uuid,jsonb,text,text,int,text) to authenticated;
-- Permit cleanup only of a user's unattached object after a failed import.
create policy helix_storage_cleanup on storage.objects for delete to authenticated using(
 bucket_id='research-private' and
 (storage.foldername(name))[1]=(select auth.uid())::text and
 not exists(select 1 from public.file_assets f where f.object_path=name)
);
-- A storage path must belong to an actual workspace where the uploader can write.
-- The previous policy only checked the uploader UUID prefix.
drop policy if exists helix_storage_insert on storage.objects;
create policy helix_storage_insert on storage.objects for insert to authenticated with check(
 bucket_id='research-private' and
 (storage.foldername(name))[1]=(select auth.uid())::text and
 (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' and
 public.is_workspace_member(((storage.foldername(name))[2])::uuid,true)
);
