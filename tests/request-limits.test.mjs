/** Tests the actual bounded JSON parser with chunked Request bodies. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const ts=require('typescript');
require.extensions['.ts']=(module,filename)=>{
 const output=ts.transpileModule(readFileSync(filename,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 module._compile(output.outputText,filename);
};
const {boundedJson}=require('../src/lib/request-limits.ts');

test('real JSON payload is parsed without any mutation',async()=>{
 const request=new Request('https://localhost.test',{method:'POST',body:'{"smiles":"C[C@H](O)N"}'});
 assert.deepEqual(await boundedJson(request,100),{smiles:'C[C@H](O)N'});
});
test('JSON array and malformed JSON are rejected',async()=>{
 await assert.rejects(boundedJson(new Request('https://localhost.test',{method:'POST',body:'[1,2]'}),100),/INVALID_JSON/);
 await assert.rejects(boundedJson(new Request('https://localhost.test',{method:'POST',body:'{bad'}),100),/INVALID_JSON/);
});
test('byte size is enforced even for non-ASCII or chunked bodies',async()=>{
 const body=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('{"x":"'));controller.enqueue(new TextEncoder().encode('🧬'.repeat(20)));controller.enqueue(new TextEncoder().encode('"}'));controller.close();}});
 const request=new Request('https://localhost.test',{method:'POST',body,duplex:'half'});
 await assert.rejects(boundedJson(request,32),/BODY_TOO_LARGE/);
});
test('declared oversized payload is rejected before reading',async()=>{
 const request=new Request('https://localhost.test',{method:'POST',body:JSON.stringify({data:'ACGT'.repeat(500)})});
 await assert.rejects(boundedJson(request,100),/BODY_TOO_LARGE/);
});
