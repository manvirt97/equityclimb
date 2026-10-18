// EquityClimb News v5.5 - targeted multi-query business intelligence
const TERMS={
 all:['business','finance','economy','investment','housing','acquisition','merger','earnings','policy','opportunity'],
 realestate:['real estate','housing','home sales','home price','mortgage','rent','rental','condo','construction','development','zoning','property','vacancy','housing starts'],
 corpdev:['acquisition','acquire','acquired','merger','divestiture','asset sale','strategic review','joint venture','takeover','purchase','transaction','combination'],
 capital:['earnings','financial results','guidance','investor','dividend','buyback','debt','bond','credit rating','equity offering','financing','capex','cash flow','ebitda','revenue'],
 opportunities:['rfp','tender','procurement','grant','incentive','funding','contract awarded','development permit','infrastructure','expansion','major project','investment'],
 finance:['interest rate','inflation','bank of canada','bond yield','mortgage rate','economy','economic growth','employment','unemployment','gdp','oil price','currency','credit'],
 government:['budget','tax','tariff','regulation','legislation','zoning','immigration','housing policy','mortgage rule','osfi','cmhc','government funding','policy']
};
const NEAR={calgary:['Calgary','Airdrie','Cochrane','Okotoks','Rocky View'],edmonton:['Edmonton','St. Albert','Sherwood Park','Leduc'],vancouver:['Vancouver','Burnaby','Richmond','Surrey'],toronto:['Toronto','Mississauga','Brampton','Markham'],ottawa:['Ottawa','Gatineau','Kanata'],montreal:['Montreal','Laval','Longueuil'],winnipeg:['Winnipeg'],halifax:['Halifax','Dartmouth']};
export async function onRequestGet({request}){
 const p=new URL(request.url).searchParams,scope=pick(p.get('scope'),['all','local','province','national','global'],'local'),category=pick(p.get('category'),Object.keys(TERMS),'all'),city=clean(p.get('city')||'Calgary'),region=clean(p.get('region')||'Alberta'),country=clean(p.get('country')||'CA',3).toUpperCase();
 const src=makeQueries({scope,category,city,region,country}),got=await Promise.allSettled(src.map(fetchFeed)),raw=[],sourceStatus=[];
 got.forEach((r,i)=>{if(r.status==='fulfilled'){raw.push(...r.value);sourceStatus.push({source:src[i].name,ok:true,count:r.value.length})}else sourceStatus.push({source:src[i].name,ok:false,error:String(r.reason).slice(0,100)})});
 const items=rank(raw,{scope,category,city,region}).slice(0,20);
 return respond({scope,category,items,fetched:new Date().toISOString(),sourceStatus},200);
}
function makeQueries({scope,category,city,region,country}){
 const key=city.toLowerCase().replace(/[^a-z]/g,''),near=NEAR[key]||[city],geo=scope==='all'?'':scope==='local'?`(${near.map(x=>`\"${x}\"`).join(' OR ')})`:scope==='province'?`\"${region}\"`:scope==='national'?(country==='CA'?'Canada':country):'';
 let qs=[];
 if(category==='corpdev')qs=[`${geo} (acquisition OR acquires OR acquired OR merger OR divestiture OR \"asset sale\" OR takeover OR transaction)`,`${geo} (\"strategic review\" OR \"joint venture\" OR partnership OR \"purchase agreement\")`];
 else if(category==='capital')qs=[`${geo} (earnings OR \"financial results\" OR guidance OR dividend OR buyback)`,`${geo} (financing OR debt OR bond OR \"credit rating\" OR \"equity offering\" OR capex)`];
 else if(category==='opportunities')qs=[`${geo} (RFP OR tender OR procurement OR grant OR incentive OR \"contract awarded\")`,`${geo} (infrastructure OR expansion OR \"major project\" OR funding OR investment)`];
 else if(category==='realestate')qs=[`${geo} (housing OR \"real estate\" OR mortgage OR rent OR construction OR development OR zoning)`];
 else if(category==='finance')qs=[`${geo} (\"interest rate\" OR inflation OR \"Bank of Canada\" OR \"bond yield\" OR employment OR GDP OR oil)`];
 else if(category==='government')qs=[`${geo} (budget OR tax OR tariff OR regulation OR legislation OR immigration OR \"housing policy\" OR CMHC OR OSFI)`];
 else qs=[`${geo} (business OR finance OR investment OR housing OR acquisition OR earnings OR policy OR opportunity)`];
 if(scope==='global')qs=qs.map(q=>q.replace(/^\s*/,''));
 return qs.map((q,i)=>({name:`Google News ${i+1}`,url:`https://news.google.com/rss/search?q=${encodeURIComponent(q+' when:30d')}&hl=en-CA&gl=CA&ceid=CA:en`}));
}
async function fetchFeed(s){const c=new AbortController(),t=setTimeout(()=>c.abort(),7000);try{const r=await fetch(s.url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; EquityClimb/5.5)','Accept':'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'},redirect:'follow',signal:c.signal});if(!r.ok)throw Error(String(r.status));return parse(await r.text())}finally{clearTimeout(t)}}
function parse(xml){return[...xml.matchAll(/<(?:item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:item|entry)>/gi)].map(m=>m[1]).map(b=>{const source=val(b,'source')||'News';let title=val(b,'title');if(source&&title.endsWith(' - '+source))title=title.slice(0,-source.length-3);return{title,link:lnk(b),source,date:val(b,'pubDate')||val(b,'published')||val(b,'updated')||new Date().toISOString(),description:text(val(b,'description')||val(b,'summary'))}}).filter(x=>x.title&&/^https?:\/\//i.test(x.link))}
function rank(items,{scope,category,city,region}){const terms=TERMS[category],seen=new Set(),places=(NEAR[city.toLowerCase().replace(/[^a-z]/g,'')]||[city]).map(x=>x.toLowerCase()),reg=region.toLowerCase();return items.map(x=>{const h=`${x.title} ${x.description}`.toLowerCase(),matches=terms.filter(t=>h.includes(t)),geoScore=scope==='local'?(places.some(p=>h.includes(p))?20:0):scope==='province'?(h.includes(reg)?15:0):5;let score=matches.length*15+geoScore;const hrs=Math.max(0,(Date.now()-new Date(x.date))/36e5);score+=Math.max(0,15-hrs/24);return{...x,category,score,matchCount:matches.length}}).filter(x=>category==='all'||x.matchCount>0).sort((a,b)=>b.score-a.score||new Date(b.date)-new Date(a.date)).filter(x=>{const k=x.title.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,100);if(!k||seen.has(k))return false;seen.add(k);return true}).map(({description,score,matchCount,...x})=>x)}
function val(b,t){return decode(b.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${t}>`,'i'))?.[1]||'').trim()}function lnk(b){const t=val(b,'link');return /^https?:\/\//i.test(t)?t:decode(b.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1]||'').trim()}function text(s){return decode(s).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}function decode(s){return String(s||'').replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')}function clean(s,n=60){return String(s||'').replace(/[<>]/g,'').trim().slice(0,n)}function pick(v,a,d){return a.includes(v)?v:d}function respond(x,s){return new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=30, stale-while-revalidate=90','access-control-allow-origin':'*'}})}
