import {NextRequest,NextResponse} from 'next/server';
import {authorizeScience,serviceEndpoint} from '@/lib/science-security';
import {boundedJson} from '@/lib/request-limits';

/** Authenticated, quota-limited SMILES descriptor proxy. */
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 const endpoint=serviceEndpoint('molecule');
 if(!endpoint)return NextResponse.json({error:'Private molecular engine not configured.'},{status:503});
 const access=await authorizeScience('molecule');
 if(access!=='allowed')return NextResponse.json({error:access==='unauthorized'?'Sign in first.':
  access==='limited'?'Molecule requests temporarily limited.':'Science authorization unavailable.'},
  {status:access==='unauthorized'?401:access==='limited'?429:503});
 let input:Record<string,unknown>;
 try{input=await boundedJson(request,10_000);}
 catch(e){return NextResponse.json({error:'Invalid or oversized request.'},
  {status:e instanceof Error&&e.message==='BODY_TOO_LARGE'?413:400});}
 if(typeof input.smiles!=='string'||input.smiles.length<1||input.smiles.length>5000)
  return NextResponse.json({error:'SMILES must be 1–5000 characters.'},{status:400});
 try{
  const upstream=await fetch(endpoint,{method:'POST',headers:{
   'Content-Type':'application/json','X-Helix-Token':process.env.SCIENCE_SERVICE_SECRET!,
  },body:JSON.stringify({smiles:input.smiles}),signal:AbortSignal.timeout(20_000),cache:'no-store'});
  const text=await upstream.text();
  if(text.length>100_000)return NextResponse.json({error:'Invalid scientific response.'},{status:502});
  let payload:unknown;
  try{payload=JSON.parse(text);}catch{return NextResponse.json({error:'Invalid scientific response.'},{status:502});}
  return NextResponse.json(payload,{status:upstream.status,headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Molecular calculation service unavailable.'},{status:503});}
}
