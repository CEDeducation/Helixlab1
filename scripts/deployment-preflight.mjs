/** Dependency-free deployment preflight; only the real Next build proves compilation. */
import {existsSync, readFileSync, readdirSync} from 'node:fs';
const problems=[];
const needed=['package.json','next.config.mjs','src/app/page.tsx',
 'src/components/KetcherCanvas.tsx','src/components/ProteinViewer.tsx',
 'science-service/main.py','science-service/Dockerfile','.env.example'];
for(const name of needed)if(!existsSync(name))problems.push(`Missing ${name}`);
const migrations=readdirSync('supabase/migrations').filter(n=>n.endsWith('.sql')).sort();
if(migrations.length!==5||migrations[4]!=='202610280001_existing_users_backfill.sql')
 problems.push('Expected five sequential SQL migrations, including existing user backfill.');
const manifest=JSON.parse(readFileSync('package.json','utf8'));
if(!/^24\./.test(readFileSync('.nvmrc','utf8').trim()))problems.push('.nvmrc must select Node 24');
if(!manifest.scripts.build||!manifest.dependencies.next)problems.push('Next.js build script/dependency missing');
const env=readFileSync('.env.example','utf8');
if(!env.includes('NEXT_PUBLIC_SUPABASE_URL=')||!env.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='))
 problems.push('Expected Supabase public environment configuration');
for(const name of ['SCIENCE_SERVICE_SECRET','SCIENCE_SERVICE_URL'])
 if(!env.includes(`${name}=`))problems.push(`Missing ${name} environment example`);
for(const file of ['src/lib/science-security.ts','src/app/api/science/molecule/route.ts']){
 const source=readFileSync(file,'utf8');
 if(source.includes('NEXT_PUBLIC_SCIENCE_SERVICE_SECRET'))
  problems.push(`A secret was exposed with a NEXT_PUBLIC_ prefix in ${file}`);
}
for(const file of readdirSync('.')){
 if(/^\.env\.(?!example$)/.test(file))problems.push(`Private .env file present: ${file}`);
}
if(problems.length){console.error(problems.join('\n'));process.exitCode=1;}
else console.log('Deployment preflight: PASS (file layout, environment examples, migration order).');
