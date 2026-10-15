import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {handleProgress} from '../../../src/progress-api.js';
export const dynamic='force-dynamic';
export async function GET(request:Request){return handleProgress(request,env.DB,await getChatGPTUser());}
export async function PUT(request:Request){return handleProgress(request,env.DB,await getChatGPTUser());}
