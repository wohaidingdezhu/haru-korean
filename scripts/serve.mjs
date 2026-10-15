import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {existsSync} from 'node:fs';
const args=process.argv.slice(2);const pi=args.indexOf('--port');const port=pi>=0?Number(args[pi+1]):4173;
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Choose a port between 1024 and 65535');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.zip':'application/zip','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{const root=path.resolve(existsSync('dist/client/index.html')?'dist/client':'dist');try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port));
