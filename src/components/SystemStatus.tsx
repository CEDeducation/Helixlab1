'use client';
import {useState} from 'react';

type Engine={installed:boolean;version:string|null;runtime_verified:boolean};
type Status={service:string;engines:Record<string,Engine>;interpretation:string;docking_note:string};

/** Runtime diagnostics for students and maintainers; availability never implies validation. */
export default function SystemStatus(){
 const [data,setData]=useState<Status|null>(null);
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function check(){
  setBusy(true);setError('');setData(null);
  try{
   const res=await fetch('/api/science/status',{method:'POST',cache:'no-store'});
   const payload=await res.json() as Status&{error?:string};
   if(!res.ok)throw new Error(payload.error||`HTTP ${res.status}`);
   setData(payload);
  }catch(e){setError(e instanceof Error?e.message:'Service is unavailable.');}
  finally{setBusy(false);}
 }
 return <div className="pageBody"><div className="pageHeading"><div>
  <span className="sectionEyebrow">OPERATIONS</span><h1>Scientific service status</h1>
  <p>Check whether each computational engine is installed on your private backend.</p>
 </div><button className="primaryButton" onClick={()=>void check()} disabled={busy}>{busy?'Checking…':'Check engines'}</button></div>
 <section className="surfaceCard hl-panel"><h2>Service readiness</h2>
 {error&&<p role="alert" className="hl-alert hl-error">{error}</p>}
 {!data&&!error&&<p>Run a check after Supabase and the Python service are deployed.</p>}
 {data&&<><div className="hl-overview-grid">{Object.entries(data.engines).map(([name,engine])=><div className="science-result" key={name}>
  <strong>{name.toUpperCase()}</strong><p>{engine.installed?'Installed':'Not installed'}</p><small>{engine.version||'No package version detected'}</small>
  <small>· Publication validation: not certified</small></div>)}</div>
 <p className="hl-muted">{data.interpretation} {data.docking_note}</p></>}
 <p className="hl-muted">Only a real Next.js build, browser workflow tests, Supabase permission tests and scientific benchmarks can establish release readiness.</p>
 </section></div>;
}
