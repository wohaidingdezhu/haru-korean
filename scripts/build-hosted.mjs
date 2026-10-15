import {spawnSync} from 'node:child_process';
import {cp,mkdir} from 'node:fs/promises';
const local=spawnSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit'});
if(local.status!==0)process.exit(local.status||1);
await mkdir('.sites-runtime',{recursive:true});
// Keep the learning app intact while the hosted build adds account-backed APIs.
await cp('dist','.sites-runtime/assets',{recursive:true});
const hosted=spawnSync(process.execPath,['scripts/run-framework.mjs','build'],{stdio:'inherit'});
process.exit(hosted.status??1);
