import type {NextRequest} from 'next/server';

/** Maximum decoded request bytes, counted before JSON parsing to resist oversized bodies. */
export async function boundedJson(request:NextRequest,maxBytes:number):Promise<Record<string,unknown>>{
 const declared=request.headers.get('content-length');
 if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>maxBytes))throw new Error('BODY_TOO_LARGE');
 if(!request.body)throw new Error('INVALID_JSON');
 const reader=request.body.getReader();const chunks:Uint8Array[]=[];let total=0;
 try{
  while(true){
   const {done,value}=await reader.read();if(done)break;
   total+=value.byteLength;
   if(total>maxBytes)throw new Error('BODY_TOO_LARGE');
   chunks.push(value);
  }
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 const bytes=new Uint8Array(total);let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 let value:unknown;
 try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
 catch{throw new Error('INVALID_JSON');}
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('INVALID_JSON');
 return value as Record<string,unknown>;
}

