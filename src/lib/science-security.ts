import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';

/** Require a real Supabase identity and consume the atomic, database-backed quota. */
export async function authorizeScience(engine:string):Promise<'allowed'|'unconfigured'|'unauthorized'|'limited'|'quota-error'>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return 'unconfigured';
 const jar=await cookies();
 const db=createServerClient(url,key,{cookies:{
  getAll:()=>jar.getAll(),
  setAll:(updates)=>{
   for(const {name,value,options} of updates){
    try{jar.set(name,value,options);}catch{/* RSC read-only contexts cannot set cookies. */}
   }
  }
 }});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)return 'unauthorized';
 const {data,error:quotaError}=await db.rpc('consume_science_quota',{requested_engine:engine});
 if(quotaError)return 'quota-error';
 return data===true?'allowed':'limited';
}

/** Reject user-facing compute endpoints with insecure remote transport. */
export function serviceEndpoint(path:string):string|null{
 const base=process.env.SCIENCE_SERVICE_URL;
 const secret=process.env.SCIENCE_SERVICE_SECRET;
 if(!base||!secret||secret.length<24)return null;
 try{
  const url=new URL(base);
  const local=['localhost','127.0.0.1','::1','[::1]'].includes(url.hostname);
  if(url.protocol!=='https:'&&!(local&&url.protocol==='http:'))return null;
  if(url.username||url.password||url.search||url.hash)return null;
  url.pathname=`${url.pathname.replace(/\/$/,'')}/v1/${path}`;
  return url.toString();
 }catch{return null;}
}
