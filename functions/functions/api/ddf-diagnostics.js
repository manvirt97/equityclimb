/** POST /api/ddf-diagnostics. Owner-only connection check; never returns credentials or listings.
 * Configure DDF_DIAGNOSTIC_TOKEN as a Cloudflare Secret. Do not put the token into GitHub.
 */
import { ddfCredentialsPresent, ddfPublicApproved, checkDdfConnection } from '../_shared/ddf-client.js';
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
function safeEq(a,b){const s=String(a||''),t=String(b||'');if(!s||s.length!==t.length)return false;let d=0;for(let i=0;i<s.length;i++)d |= s.charCodeAt(i)^t.charCodeAt(i);return d===0;}
export async function onRequestPost({request,env}){
 const token=request.headers.get('x-equityclimb-admin-token');
 if(!env.DDF_DIAGNOSTIC_TOKEN||String(env.DDF_DIAGNOSTIC_TOKEN).length<24||!safeEq(token,env.DDF_DIAGNOSTIC_TOKEN))return reply({error:'Not authorized.'},403);
 if(!ddfCredentialsPresent(env))return reply({authenticated:false,publicEnabled:false,message:'DDF feed credentials not configured.'});
 try{return reply(await checkDdfConnection(env));}
 catch(e){return reply({authenticated:false,publicEnabled:ddfPublicApproved(env),message:String(e.message||'Could not authenticate.').slice(0,160)},502);}
}
