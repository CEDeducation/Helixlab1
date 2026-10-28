import {NextResponse} from 'next/server';
import {authorizeScience,serviceEndpoint} from '@/lib/science-security';

/** Authenticated capability diagnostics: never expose server-side credentials. */
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function POST(){
 const endpoint=serviceEndpoint('capabilities');
 if(!endpoint)return NextResponse.json({error:'Scientific service is not configured securely.'},{status:503});
 const access=await authorizeScience('status');
 if(access!=='allowed')return NextResponse.json({error:access==='unauthorized'?'Sign in required.':
  access==='limited'?'Rate limited.':'Quota service unavailable.'},
  {status:access==='unauthorized'?401:access==='limited'?429:503});
 try{
  const response=await fetch(endpoint,{headers:{'X-Helix-Token':process.env.SCIENCE_SERVICE_SECRET!},
   cache:'no-store',signal:AbortSignal.timeout(12_000)});
  if(!response.ok)return NextResponse.json({error:'Scientific service refused its readiness check.'},{status:503});
  const data:unknown=await response.json();
  return NextResponse.json(data,{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Scientific service cannot be reached.'},{status:503});}
}
