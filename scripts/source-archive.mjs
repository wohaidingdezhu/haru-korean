import {readdir,readFile,writeFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {zipSync} from 'fflate';
export async function writeSourceArchive(){
 const names=['app','db','drizzle','build','lib','.openai/hosting.json','vite.config.ts','drizzle.config.ts','cloudflare-env.d.ts','next.config.ts','tsconfig.json','src','public','scripts','tests','upstream','package.json','package-lock.json','LICENSE','README.md','THIRD_PARTY_NOTICES.md'];
 const files={};
 async function add(name){const info=await stat(name);if(info.isDirectory()){for(const child of await readdir(name)){if(child==='__pycache__'||child==='.git')continue;await add(join(name,child));}}else{files['haru-korean/'+name.replaceAll('\\','/')]=new Uint8Array(await readFile(name));}}
 for(const name of names)await add(name);
 await writeFile('dist/source.zip',zipSync(files,{level:6}));
}
