import { readCatalogue } from '../_shared/ai-registry.js';
export async function onRequestGet({env}) {
  return new Response(JSON.stringify(readCatalogue(env)),{
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, max-age=300','x-content-type-options':'nosniff'}
  });
}
