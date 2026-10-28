/** Check that every local TS/TSX file parses without downloading npm packages. */
import {createRequire} from 'node:module';
import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const errors=[];
function walk(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    const file=join(dir,entry.name);
    if(entry.isDirectory()){walk(file);continue;}
    if(!/\.tsx?$/.test(entry.name))continue;
    const source=readFileSync(file,'utf8');
    const result=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,
      compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,
        target:ts.ScriptTarget.ES2022}});
    for(const diagnostic of result.diagnostics||[]){
      if(diagnostic.category===ts.DiagnosticCategory.Error){
        errors.push(`${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')}`);
      }
    }
  }
}
walk('src');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log('All TypeScript and TSX files parsed successfully.');
