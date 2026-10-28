/** Stable release gate: do not pretend an unlocked npm install is reproducible. */
import {existsSync,readFileSync} from 'node:fs';
const filename='package-lock.json';
if(!existsSync(filename)){
 console.error('No package-lock.json. On a networked dev machine run npm install, verify build, and commit the lockfile before stable release.');
 process.exit(1);
}
const lock=JSON.parse(readFileSync(filename,'utf8'));
if(lock.lockfileVersion<3||!lock.packages?.['']){
 console.error('Invalid or obsolete npm lockfile. Regenerate with the project Node/npm toolchain.');
 process.exit(1);
}
console.log('npm lockfile is present; review the exact resolved dependency graph in CI.');
