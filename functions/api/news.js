// EquityClimb v5.4: strict, source-diverse business intelligence feed
const TERMS={
 all:['business','finance','economy','investment','housing','deal','acquisition','earnings','policy','opportunity'],
 realestate:['real estate','housing','home sales','home price','mortgage','rent','rental','condo','construction','development','zoning','property','vacancy','housing starts'],
 corpdev:['acquisition','acquire','acquired','merger','transaction','divestiture','asset sale','strategic review','joint venture','partnership','takeover','deal','purchase agreement','combination'],
 capital:['earnings','financial results','guidance','investor','dividend','buyback','debt','bond','credit rating','equity offering','financing','capex','free cash flow','ebitda','revenue','quarter results'],
 opportunities:['rfp','request for proposal','tender','procurement','grant','incentive','funding','contract awarded','development permit','infrastructure','expansion','major project','investment opportunity'],
 finance:['interest rate','inflation','bank of canada','bond yield','mortgage rate','economy','economic growth','employment','unemployment','gdp','oil price','currency','credit'],
 government:['budget','tax','tariff','regulation','legislation','zoning','immigration','housing policy','mortgage rule','osfi','cmhc','government funding','policy']
};
const NEAR={calgary:['Calgary','Airdrie','Cochrane','Okotoks','Rocky View'],edmonton:['Edmonton','St. Albert','Sherwood Park','Leduc'],vancouver:['Vancouver','Burnaby','Richmond','Surrey'],toronto:['Toronto','Mississauga','Brampton','Markham'],ottawa:['Ottawa','Gatineau','Kanata'],montreal:['Montreal','Laval','Longueuil'],winnipeg:['Winnipeg'],halifax:['Halifax','Dartmouth']};
const CBCREG={calgary:'https://www.cbc.ca/webfeed/rss/rss-canada-calgary',edmonton:'https://www.cbc.ca/webfeed/rss/rss-canada-edmonton',vancouver:'https://www.cbc.ca/webfeed/rss/rss-canada-britishcolumbia',toronto:'https://www.cbc.ca/webfeed/rss/rss-canada-toronto',ottawa:'https://www.cbc.ca/webfeed/rss/rss-canada-ottawa',montreal:'https://www.cbc.ca/webfeed/rss/rss-canada-montreal',winnipeg:'https://www.cbc.ca/webfeed/rss/rss-canada-manitoba',halifax:'https://www.cbc.ca/webfeed/rss/rss-canada-novascotia'};
export async function onRequestGet({request}){
 const q=new URL(request.url).searchParams,scope=pick(q.get('scope'),['all','local','province','national','global'],'local'),category=pick(q.get('category'),Object.keys(TERMS),'all'),city=clean(q.get('city')||'Calgary'),region=clean(q.get('region')||'Alberta'),country=clean(q.get('country')||'CA',3).toUpperCase();
 const sources=buildSources({scope,category,city,region,country});
 const settled=await Promise.allSettled(sources.map(fetchFeed)),raw=[],sourceStatus=[];
 settled.forEach((r,i)=>{if(r.status==='fulfilled'){raw.push(...r.value.map(x=>({...x,queryScoped:sources[i].queryScoped||false})));sourceStatus.push({source:sources[i].name,ok:true,count:r.value.length})}else sourceStatus.push({source:sources[i].name,ok:false,error:String(r.reason).slice(0,110)})});
 const items=rank(raw,{scope,category,city,region}).slice(0,18);
 return json({scope,category,items,fetched:new Date().toISOString(),sourceStatus},200);
}
function buildSources({scope,category,city,region,country}){
 const terms=TERMS[category],cityKey=city.toLowerCase().replace(/[^a-z]/g,''),near=NEAR[cityKey]||[city],geo=scope==='all'?'':scope==='local'?`(${near.map(x=>`\"${x}\"`).join(' OR ')})`:scope==='province'?`\"${region}\"`:scope==='national'?(country==='CA'?'Canada':country):'global';
 const categoryQuery=category==='all'?'(business OR finance OR economy OR investment OR housing OR acquisition)':`(${terms.slice(0,12).map(x=>`\"${x}\"`).join(' OR ')})`;
 const rssQuery=[geo,categoryQuery,'when:14d'].filter(Boolean).join(' '),google={name:'Google News',url:`https://news.google.com/rss/search?q=${encodeURIComponent(rssQuery)}&hl=en-CA&gl=CA&ceid=CA:en`,queryScoped:true};
 const out=[google];
 // Broad publisher feeds are safe for All Intelligence only. Specialist categories remain strict.
 if(category==='all'){
  if(scope==='local'&&CBCREG[cityKey])out.push({name:`CBC ${city}`,url:CBCREG[cityKey]});
  if(scope==='global')out.push({name:'CBC World',url:'https://www.cbc.ca/webfeed/rss/rss-world'});
  else out.push({name:'CBC Business',url:'https://www.cbc.ca/webfeed/rss/rss-business'});
  out.push({name:'Global News',url:'https://globalnews.ca/feed/'});
 }
 return out;
}
async function fetchFeed(s){const c=new AbortController(),t=setTimeout(()=>c.abort(),6500);try{const r=await fetch(s.url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; EquityClimb/5.4)','Accept':'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'},redirect:'follow',signal:c.signal});if(!r.ok)throw Error(`${r.status} ${r.statusText}`);return parse(await r.text(),s.name)}finally{clearTimeout(t)}}
function parse(xml,fallback){return[...xml.matchAll(/<(?:item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:item|entry)>/gi)].map(m=>m[1]).map(b=>{const source=val(b,'source')||fallback;let title=val(b,'title');if(source&&title.endsWith(' - '+source))title=title.slice(0,-source.length-3);return{title,link:lnk(b),source,date:val(b,'pubDate')||val(b,'published')||val(b,'updated')||new Date().toISOString(),description:strip(val(b,'description')||val(b,'summary'))}}).filter(x=>x.title&&/^https?:\/\//i.test(x.link))}
function rank(items,{scope,category,city,region}){const terms=TERMS[category],seen=new Set(),cityKey=city.toLowerCase(),regionKey=region.toLowerCase();return items.map(x=>{const h=`${x.title} ${x.description}`.toLowerCase(),matches=terms.filter(t=>h.includes(t)),catOK=category==='all'||matches.length>0,geoOK=x.queryScoped||scope==='all'||scope==='global'||(scope==='local'&&h.includes(cityKey))||(scope==='province'&&h.includes(regionKey))||scope==='national';let score=matches.length*12+(x.queryScoped?9:0);const hours=Math.max(0,(Date.now()-new Date(x.date))/36e5);score+=Math.max(0,12-hours/12);return{...x,category,catOK,geoOK,score}}).filter(x=>x.catOK&&x.geoOK).sort((a,b)=>b.score-a.score||new Date(b.date)-new Date(a.date)).filter(x=>{const k=x.title.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,90);if(!k||seen.has(k))return false;seen.add(k);return true}).map(({description,catOK,geoOK,score,queryScoped,...x})=>x)}
function val(b,t){return decode(b.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${t}>`,'i'))?.[1]||'').trim()}function lnk(b){const t=val(b,'link');return /^https?:\/\//i.test(t)?t:decode(b.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1]||'').trim()}function strip(s){return decode(s).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}function decode(s){return String(s||'').replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')}function clean(s,n=60){return String(s||'').replace(/[<>]/g,'').trim().slice(0,n)}function pick(v,a,d){return a.includes(v)?v:d}function json(x,status){return new Response(JSON.stringify(x),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=30, stale-while-revalidate=90','access-control-allow-origin':'*'}})}
