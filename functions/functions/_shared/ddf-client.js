/** REALTOR.ca DDF Web API OAuth 2.0 adapter.
 * Official docs: https://ddfapi-docs.realtor.ca/
 * This module never grants display rights. The caller must have an executed CREA agreement,
 * compliant lead/analytics/attribution integration, and authorization for the deployment.
 */
const IDENTITY = 'https://identity.crea.ca/connect/token';
const BASE = 'https://ddfapi.realtor.ca/odata/v1/';
let tokenCache = { key:'', access:'', expires:0 };
const str=(x,n=140)=>String(x??'').trim().slice(0,n);
const https=(value)=>{try{const u=new URL(str(value,2048));return u.protocol==='https:'?u.href:'';}catch{return '';}};
function bounds(value,lo,hi){if(value===undefined||value===null||value==='')return null;const x=Number(value);return Number.isFinite(x)?Math.min(hi,Math.max(lo,x)):null;}
export function ddfCredentialsPresent(env){return Boolean(env.DDF_CLIENT_ID && env.DDF_CLIENT_SECRET);}
export function ddfPublicApproved(env){return ddfCredentialsPresent(env)&&['DDF_WRITTEN_RIGHTS','DDF_LEADS_READY','DDF_ANALYTICS_READY','DDF_DISPLAY_REVIEWED','DDF_PUBLIC_ENABLED'].every(k=>String(env[k]||'').toLowerCase()==='on');}
export async function getDdfToken(env,fetcher=fetch){
 if(!ddfCredentialsPresent(env))throw Error('DDF credentials have not been configured.');
 const cacheKey=String(env.DDF_CLIENT_ID);if(tokenCache.key===cacheKey&&tokenCache.expires>Date.now()+120000)return tokenCache.access;
 const form=new URLSearchParams({grant_type:'client_credentials',client_id:env.DDF_CLIENT_ID,client_secret:env.DDF_CLIENT_SECRET,scope:'DDFApi_Read'});
 const r=await fetcher(IDENTITY,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:form.toString(),signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error('DDF authentication was rejected. Check authorized feed credentials.');
 const data=await r.json();if(!data.access_token||!Number.isFinite(Number(data.expires_in)))throw Error('DDF token response is incomplete.');
 tokenCache={key:cacheKey,access:String(data.access_token),expires:Date.now()+Math.max(0,Number(data.expires_in)-60)*1000};return tokenCache.access;
}
export function ddfSearchParams(q){
 const city=str(q.get('city'),60).replace(/[^\p{L}\p{N} .'-]/gu,'');
 if(city.length<2)throw Error('Please enter a city.');
 const filters=[`City eq '${city.replace(/'/g,"''")}'`];
 const min=bounds(q.get('minPrice'),0,20000000),max=bounds(q.get('maxPrice'),0,20000000);
 if(min!==null&&max!==null&&min>max)throw Error('Maximum price must be greater than minimum.');
 if(min!==null&&min>0)filters.push(`ListPrice ge ${Math.round(min)}`);
 if(max!==null&&max>0)filters.push(`ListPrice le ${Math.round(max)}`);
 const beds=bounds(q.get('beds'),0,20),baths=bounds(q.get('baths'),0,20);
 if(beds)filters.push(`BedroomsTotal ge ${Math.floor(beds)}`);
 if(baths)filters.push(`BathroomsTotalInteger ge ${Math.floor(baths)}`);
 if(q.get('property')==='condo')filters.push("CommonInterest eq 'Condo/Strata'");
 if(q.get('property')==='house')filters.push("CommonInterest ne 'Condo/Strata'");
 // Rental listings are excluded unless a permitted and verified Property type filter is configured.
 if(q.get('type')==='lease')throw Error('DDF rental search awaits confirmation of the licensed field mapping.');
 const page=Math.floor(bounds(q.get('page'),1,50)||1);
 const p=new URLSearchParams({'$filter':filters.join(' and '),'$top':'12','$skip':String((page-1)*12)});
 return {params:p,page,city};
}
export function normalizeDdfProperty(x){
 if(!x||x.InternetEntireListingDisplayYN===false||x.StandardStatus && x.StandardStatus!=='Active')return null;
 const id=str(x.ListingKey,90),price=bounds(x.ListPrice,0,200000000);
 if(!id||price===null)return null;
 const addressAllowed=x.InternetAddressDisplayYN!==false;
 const street=[x.UnitNumber?('#'+str(x.UnitNumber,15)):null,x.StreetNumber,x.StreetDirPrefix,x.StreetName,x.StreetSuffix,x.StreetDirSuffix].filter(Boolean).join(' ');
 const geoOk=addressAllowed&&Number.isFinite(Number(x.Latitude))&&Number.isFinite(Number(x.Longitude))&&Number(x.Latitude)!==0&&Number(x.Longitude)!==0;
 const photos=(Array.isArray(x.Media)?x.Media:[]).filter(m=>m&&(m.MediaCategory==='Photo'||!m.MediaCategory))
   .sort((a,b)=>(Number(a.Order)||0)-(Number(b.Order)||0)).map(m=>https(m.MediaURL||m.LargePhotoURL||m.PhotoURL)).filter(Boolean).slice(0,12);
 const member=x.ListAgent||{};const office=x.ListOffice||{};
 const agentName=str(x.ListAgentFullName||member.MemberFullName||[member.MemberFirstName,member.MemberLastName].filter(Boolean).join(' '),150);
 const brokerage=str(x.ListOfficeName||office.OfficeName,150);
 const link=https(x.ListingURL||x.ListingUrl||x.RealtorCaURL);
 return {
   id,listingKey:id,mlsNumber:str(x.ListingId,80),price,city:str(x.City,80),area:str(x.SubdivisionName||x.CityRegion,100),
   address:addressAllowed?str(street,180):'Address withheld by listing agent',beds:bounds(x.BedroomsTotal,0,25),
   baths:bounds(x.BathroomsTotalInteger,0,25),type:str(x.PropertySubType||x.PropertyType||'Residential',100),
   sqft:bounds(x.BuildingAreaTotal,0,500000),lat:geoOk?Number(x.Latitude):null,lng:geoOk?Number(x.Longitude):null,
   images:photos,brokerage,agents:agentName?[agentName+(member.JobTitle?' · '+str(member.JobTitle,60):'')]:[],
   memberKey:str(x.ListAgentKey||member.MemberKey,90),officeKey:str(x.ListOfficeKey||office.OfficeKey,90),
   sourceUrl:link,source:'REALTOR.ca DDF',poweredBy:'REALTOR.ca',listedDate:str(x.OriginalEntryTimestamp,40),
   updatedAt:str(x.ModificationTimestamp,40),licensing:'DDF Advertising Website'
 };
}
export async function ddfRequest(env,path,search='',fetcher=fetch){
 const access=await getDdfToken(env,fetcher);
 if(!/^Property(?:\/[A-Za-z0-9'()_-]+)?$/.test(path))throw Error('Resource not permitted.');
 const url=BASE+path+(search?'?'+search:'');
 const r=await fetcher(url,{headers:{authorization:`Bearer ${access}`,accept:'application/json'},signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw Error(r.status===401||r.status===403?'DDF feed access denied.':'The licensed feed is currently unavailable.');
 return r.json();
}
export async function queryDdfListings(env,q,fetcher=fetch){
 const {params,page}=ddfSearchParams(q);
 const data=await ddfRequest(env,'Property',params.toString(),fetcher);
 const values=Array.isArray(data.value)?data.value:[];
 const items=values.map(normalizeDdfProperty).filter(Boolean);
 return {enabled:true,provider:'REALTOR.ca DDF',items,page,pages:values.length===12?page+1:page,
   total:null,hasMore:!!data['@odata.nextLink']||values.length===12,fetchedAt:new Date().toISOString(),
   note:'Only participating, approved DDF inventory. Listing information may change; comply with required attribution and inquiries.'};
}
// For owner diagnostics only; never returns listing records or credentials.
export async function checkDdfConnection(env,fetcher=fetch){
 const token=await getDdfToken(env,fetcher);
 return {authenticated:!!token,publicEnabled:ddfPublicApproved(env),message:'Token obtained from the official CREA identity server.'};
}
