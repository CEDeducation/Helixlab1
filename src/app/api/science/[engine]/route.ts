import {NextRequest,NextResponse} from 'next/server';
import {authorizeScience,serviceEndpoint} from '@/lib/science-security';
import {boundedJson} from '@/lib/request-limits';

/** Fixed route allowlist; never proxy a user-supplied URL or engine path. */
const engines:Record<string,{path:string;limit:number;timeout:number}>={
 primers:{path:'primers',limit:110_000,timeout:45_000},
 'pharmacophore-ligand':{path:'pharmacophore/ligand',limit:60_000,timeout:45_000},
 'pharmacophore-structure':{path:'pharmacophore/structure',limit:2_400_000,timeout:60_000},
 dock:{path:'dock',limit:2_600_000,timeout:110_000},
};
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function POST(request:NextRequest,{params}:{params:Promise<{engine:string}>}){
 const {engine}=await params;
 const config=engines[engine];
 if(!config)return NextResponse.json({error:'Unknown scientific engine.'},{status:404});
 const endpoint=serviceEndpoint(config.path);
 if(!endpoint)return NextResponse.json({error:'Private scientific compute service is not securely configured.'},{status:503});
 const access=await authorizeScience(engine);
 if(access!=='allowed'){
  const status=access==='unauthorized'?401:access==='limited'?429:503;
  return NextResponse.json({error:access==='limited'?'Compute request quota exceeded.':
   access==='unauthorized'?'Authentication required.':'Scientific authentication or quota backend unavailable.'},
   {status,headers:{'Cache-Control':'no-store'}});
 }
 let input:Record<string,unknown>;
 try{input=await boundedJson(request,config.limit);}
 catch(e){return NextResponse.json({error:e instanceof Error&&e.message==='BODY_TOO_LARGE'?
  'Scientific request exceeds size limit.':'Scientific request must contain valid JSON.'},
  {status:e instanceof Error&&e.message==='BODY_TOO_LARGE'?413:400});}
 try{
  const upstream=await fetch(endpoint,{method:'POST',headers:{
   'Content-Type':'application/json','X-Helix-Token':process.env.SCIENCE_SERVICE_SECRET!,
  },body:JSON.stringify(input),cache:'no-store',signal:AbortSignal.timeout(config.timeout)});
  const response=await upstream.text();
  if(new TextEncoder().encode(response).length>2_000_000)
   return NextResponse.json({error:'Scientific engine returned an oversized response.'},{status:502});
  let data:unknown;
  try{data=JSON.parse(response);}catch{return NextResponse.json({error:'Scientific engine returned invalid JSON.'},{status:502});}
  return NextResponse.json(data,{status:upstream.status,headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Scientific engine unavailable or request timed out.'},{status:503});}
}
