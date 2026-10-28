import {client} from './supabase';
import type {LabWorkspace,StudentProfile,ScientificRecord,LabMember,ParsedSequence} from './types';
/** Supabase RLS is the authorization source of truth; never trust persona IDs for permission. */
export async function listWorkspaces():Promise<LabWorkspace[]> {
  const db=client();
  const {data,error}=await db.from('workspaces').select('id,name,owner_id').order('created_at');
  if(error)throw error;
  if(!data?.length)throw new Error('No workspace found. Verify your account then sign in.');
  return data as LabWorkspace[];
}
export async function getProfiles(workspaceId:string):Promise<StudentProfile[]> {
  const {data,error}=await client().from('student_profiles').select('id,workspace_id,slot,display_name,color').eq('workspace_id',workspaceId).order('slot');
  if(error)throw error; return (data||[]) as StudentProfile[];
}
export async function addProfile(workspaceId:string,existing:StudentProfile[],name:string):Promise<void>{
  const used=new Set(existing.map(p=>p.slot));
  const slot=[1,2,3,4,5].find(s=>!used.has(s));
  if(!slot)throw new Error('Maximum five profiles.');
  const {error}=await client().from('student_profiles').insert({workspace_id:workspaceId,slot,display_name:name.slice(0,60).trim(),color:['#7257c7','#2f9d76','#d8942f','#4b8fb6','#d56d82'][slot-1]});
  if(error)throw error;
}
export async function listRecords(workspaceId:string):Promise<ScientificRecord[]> {
  const {data,error}=await client().from('scientific_records').select('id,workspace_id,name,type,content,revision,created_at').eq('workspace_id',workspaceId).order('created_at',{ascending:false}).limit(250);
  if(error)throw error; return (data||[]) as ScientificRecord[];
}
export async function saveRecord(workspaceId:string,name:string,type:string,content:Record<string,unknown>,id?:string):Promise<string>{
  const db=client();
  const payload={workspace_id:workspaceId,name:name.slice(0,160),type,content};
  // Server trigger sets authenticated author; never trust a client-supplied user ID.
  const response=id?await db.from('scientific_records').update(payload).eq('id',id).eq('workspace_id',workspaceId).select('id').single():await db.from('scientific_records').insert(payload).select('id').single();
  if(response.error)throw response.error;
  return response.data.id as string;
}
export async function listMembers(workspaceId:string):Promise<LabMember[]>{
  const {data,error}=await client().from('workspace_members').select('workspace_id,user_id,role').eq('workspace_id',workspaceId);
  if(error)throw error;return (data||[]) as LabMember[];
}
export async function inviteCollaborator(workspaceId:string,email:string,role:'editor'|'viewer'){
  const db=client();const {data:user,error:authError}=await db.auth.getUser();
  if(authError||!user.user)throw new Error('Sign in first.');
  const {data,error}=await db.from('invites').insert({workspace_id:workspaceId,email:email.toLowerCase().trim(),role,invited_by:user.user.id}).select('id').single();
  if(error)throw error; return data.id as string;
}
export async function acceptInvite(inviteId:string){
  const {error}=await client().rpc('accept_invite',{invite_id:inviteId});if(error)throw error;
}
/** Upload an unmodified original as private octet-stream, with a digest for later verification. */
export async function archiveOriginal(workspaceId:string,recordId:string,file:File):Promise<string>{
  if(file.size<1||file.size>8_000_000)throw new Error('Files must be 1 byte to 8 MB.');
  if(!/\.(fa|fasta|fna|fas|gb|gbk|genbank|txt)$/i.test(file.name))throw new Error('Unsupported original-file extension.');
  const db=client();const {data:{user}}=await db.auth.getUser();if(!user)throw new Error('Login required.');
  const buffer=await file.arrayBuffer();
  const bytes=await crypto.subtle.digest('SHA-256',buffer);
  const sha256=[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const objectPath=`${user.id}/${workspaceId}/${crypto.randomUUID()}`;
  const {error:storageError}=await db.storage.from('research-private').upload(objectPath,buffer,{contentType:'application/octet-stream',upsert:false});
  if(storageError)throw storageError;
  const {error}=await db.from('file_assets').insert({workspace_id:workspaceId,record_id:recordId,uploader_id:user.id,object_path:objectPath,filename:file.name,mime_type:'application/octet-stream',bytes:file.size,sha256});
  if(error){const {error:cleanup}=await db.storage.from('research-private').remove([objectPath]);
   throw new Error(`Original metadata save failed: ${error.message}.${cleanup?' Unattached file cleanup failed.':''}`);}
  return sha256;
}

/**
 * Import parsed DNA records atomically in PostgreSQL after archiving the exact
 * original bytes. On DB failure, try to delete only the unattached blob.
 * SHA-256 identifies the original source; no silent data cleaning is performed.
 */
export async function importSequenceBatch(
  workspaceId:string,records:ParsedSequence[],file:File
):Promise<string[]> {
  if(!records.length||records.length>50)throw new Error('Import supports 1–50 records.');
  if(file.size<1||file.size>5_000_000)throw new Error('Source file must be 1 byte–5 MB.');
  const db=client();
  const {data:{user},error:userError}=await db.auth.getUser();
  if(userError||!user)throw new Error('Sign in before importing.');
  const contents=await file.arrayBuffer();
  const checksum=await crypto.subtle.digest('SHA-256',contents);
  const sha256=[...new Uint8Array(checksum)].map(v=>v.toString(16).padStart(2,'0')).join('');
  const objectPath=`${user.id}/${workspaceId}/${crypto.randomUUID()}`;
  const bucket=db.storage.from('research-private');
  const {error:uploadError}=await bucket.upload(objectPath,contents,{
    contentType:'application/octet-stream',upsert:false
  });
  if(uploadError)throw uploadError;
  const {data,error}=await db.rpc('import_sequence_batch',{
    target_workspace:workspaceId,
    items:records.map(r=>({name:r.name,sequence:r.sequence,
      topology:r.topology,features:r.features,format:r.format,warnings:r.warnings})),
    storage_path:objectPath,original_filename:file.name,
    original_size:file.size,original_sha256:sha256
  });
  if(error){
    const {error:cleanupError}=await bucket.remove([objectPath]);
    const extra=cleanupError?' Original file cleanup failed; contact administrator.':'';
    throw new Error(`Import rejected; no records were saved: ${error.message}.${extra}`);
  }
  return data as string[];
}
