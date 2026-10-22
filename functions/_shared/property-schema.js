/* Source-neutral records for *future authorized* MLS feeds.
   An agreement-specific adapter must validate licensed fields BEFORE using this schema.
   This file deliberately does not download or reproduce third-party listings. */
export const PROPERTY_FIELDS = Object.freeze([
  'source','sourceId','listingStatus','purpose','price','currency','address','city','province',
  'neighbourhood','beds','baths','propertyType','lat','lng','images','listingUrl',
  'brokerage','agents','updatedAt','rights','requiredAttribution'
]);
export const definedString = (x,limit=200)=>String(x??'').trim().slice(0,limit);
const url=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.toString():null;}catch{return null;}};
export function validateAuthorizedListing(raw,rights){
  if(!rights || rights.authorized!==true || !rights.contractId)return {ok:false,error:'No source display rights recorded.'};
  if(!rights.allowedFields || !Array.isArray(rights.allowedFields))return {ok:false,error:'Permitted fields are not configured.'};
  const result={};
  const allowed=new Set(rights.allowedFields.filter(f=>PROPERTY_FIELDS.includes(f)));
  for(const field of allowed){if(raw[field]!==undefined)result[field]=raw[field];}
  if(!result.source||!result.sourceId)return {ok:false,error:'Record missing source identity.'};
  if(result.images)result.images=Array.isArray(result.images)?result.images.map(url).filter(Boolean).slice(0,16):[];
  if(result.listingUrl)result.listingUrl=url(result.listingUrl);
  if(result.price!==undefined && (!Number.isFinite(+result.price) || +result.price<0))return {ok:false,error:'Invalid price.'};
  if(rights.addressVisible===false){result.address='Address withheld by listing agent';result.lat=null;result.lng=null;}
  result.rights={source:definedString(result.source,70),contractId:definedString(rights.contractId,80),
    attribution:definedString(rights.attribution,200),expiresAt:definedString(rights.expiresAt,40)};
  return {ok:true,item:result};
}
