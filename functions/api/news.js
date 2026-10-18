// EquityClimb Market Intelligence endpoint v4
// /api/news?scope=local|province|national|global&category=realestate|corpdev|capital|opportunities|finance|government

const CBC_REGIONAL={calgary:'https://www.cbc.ca/webfeed/rss/rss-canada-calgary',edmonton:'https://www.cbc.ca/webfeed/rss/rss-canada-edmonton',vancouver:'https://www.cbc.ca/webfeed/rss/rss-canada-britishcolumbia',victoria:'https://www.cbc.ca/webfeed/rss/rss-canada-britishcolumbia',toronto:'https://www.cbc.ca/webfeed/rss/rss-canada-toronto',ottawa:'https://www.cbc.ca/webfeed/rss/rss-canada-ottawa',montreal:'https://www.cbc.ca/webfeed/rss/rss-canada-montreal',winnipeg:'https://www.cbc.ca/webfeed/rss/rss-canada-manitoba',regina:'https://www.cbc.ca/webfeed/rss/rss-canada-saskatchewan',saskatoon:'https://www.cbc.ca/webfeed/rss/rss-canada-saskatoon',halifax:'https://www.cbc.ca/webfeed/rss/rss-canada-novascotia'};
const CATEGORY={
 realestate:{label:'Real Estate',terms:['real estate','housing','home sales','home price','house price','mortgage','rent','rental','condo','construction','development','zoning','property','vacancy','housing starts']},
 corpdev:{label:'Corp Dev',terms:['acquisition','acquired','merger','transaction','divestiture','strategic review','joint venture','partnership','asset sale','takeover','deal','offtake']},
 capital:{label:'Capital Markets',terms:['earnings','financial results','guidance','investor day','dividend','buyback','debt','bond','credit rating','equity offering','financing','capex','free cash flow','ebitda','revenue','material change']},
 opportunities:{label:'Opportunities',terms:['rfp','tender','procurement','grant','incentive','funding','land sale','development permit','infrastructure','housing program','construction project','expansion','major project','contract awarded']},
 finance:{label:'Finance & Rates',terms:['interest rate','rates','inflation','bank of canada','federal reserve','bond yield','mortgage rate','economy','economic','employment','unemployment','gdp','oil price','currency','credit']},
 government:{label:'Government',terms:['budget','tax','tariff','regulation','legislation','zoning','immigration','housing policy','mortgage rule','osfi','cmhc','bank of canada','finance canada','government funding','government announces']}
};
export async function onRequestGet({request}){
 const p=new URL(request.url).searchParams;
 const scope=oneOf(p.get('scope'),['local','province','national','global'],'national');
 const category=oneOf(p.get('category'),Object.keys(CATEGORY),'realestate');
 const city=clean(p.get('city')||'Calgary',60),region=clean(p.get('region')||'Alberta',60),cc=clean(p.get('country')||'CA',3).toUpperCase();
 const sources=sourceList(scope,category,city,region,cc);
 const settled=await Promise.allSettled(sources.map(fetchFeed));
 const all=[],sourceStatus=[];
 settled.forEach((r,i)=>{if(r.status==='fulfilled'){all.push(...r.value);sourceStatus.push({source:sources[i].name,ok:true,count:r.value.length})}else sourceStatus.push({source:sources[i].name,ok:false,error:String(r.reason).slice(0,120)})});
 const items=rank(all,{scope,category,city,region}).slice(0,16);
 return response({scope,category,items,fetched:new Date().toISOString(),sourceStatus,error:items.length?undefined:'No relevant stories were returned by the available sources.'},items.length?200:502);
}
function sourceList(scope,category,city,region,cc){
 const c=CATEGORY[category];
 const geo=scope==='local'?`\"${city}\"`:scope==='province'?`\"${region}\"`:scope==='national'?(cc==='CA'?'Canada':cc):'';
 const query=[geo,`(${c.terms.slice(0,9).map(t=>`\"${t}\"`).join(' OR ')})`,'when:7d'].filter(Boolean).join(' ');
 const gl=cc==='CA'?'CA':'US';
 const google={name:'Google News',url:`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-${gl}&gl=${gl}&ceid=${gl}:en`};
 const business={name:'CBC Business',url:'https://www.cbc.ca/webfeed/rss/rss-business'};
 const canada={name:'CBC Canada',url:'https://www.cbc.ca/webfeed/rss/rss-canada'};
 const world={name:'CBC World',url:'https://www.cbc.ca/webfeed/rss/rss-world'};
 const global={name:'Global News',url:'https://globalnews.ca/feed/'};
 const local={name:`CBC ${city}`,url:CBC_REGIONAL[city.toLowerCase().replace(/[^a-z]/g,'')]||canada.url};
 if(scope==='local')return[google,local,business,global];
 if(scope==='province')return[google,local,canada,business];
 if(scope==='global')return[google,world,business,global];
 return[google,business,canada,global];
}
async function fetchFeed(source){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),6500);
 try{
  const r=await fetch(source.url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; EquityClimb/4.0; +https://equityclimb.pages.dev)','Accept':'application/rss+xml, application/atom+xml, application/xml, text/xml, */*','Accept-Language':'en-CA,en;q=0.9'},redirect:'follow',signal:controller.signal});
  if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);const text=await r.text();if(!text.includes('<item')&&!text.includes('<entry'))throw new Error('Not RSS/Atom');return parse(text,source.name);
 }finally{clearTimeout(timer)}
}
function parse(xml,fallback){
 const blocks=[...xml.matchAll(/<(?:item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:item|entry)>/gi)].map(m=>m[1]);
 return blocks.map(b=>{const source=value(b,'source')||fallback;let title=value(b,'title');if(source&&title.endsWith(' - '+source))title=title.slice(0,-source.length-3);return{title,link:link(b),source,date:value(b,'pubDate')||value(b,'published')||value(b,'updated')||new Date().toISOString(),description:strip(value(b,'description')||value(b,'summary'))}}).filter(x=>x.title&&/^https?:\/\//i.test(x.link));
}
function rank(items,{scope,category,city,region}){
 const terms=CATEGORY[category].terms,seen=new Set();
 return items.map(item=>{const hay=`${item.title} ${item.description}`.toLowerCase();const matches=terms.filter(t=>hay.includes(t));let score=matches.length*6;if(scope==='local'&&hay.includes(city.toLowerCase()))score+=10;if(scope==='province'&&hay.includes(region.toLowerCase()))score+=8;const hours=Math.max(0,(Date.now()-new Date(item.date))/36e5);score+=Math.max(0,8-hours/12);return{...item,category,score,matches}})
  .filter(x=>x.matches.length>0)
  .sort((a,b)=>b.score-a.score||new Date(b.date)-new Date(a.date))
  .filter(x=>{const k=x.title.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,90);if(!k||seen.has(k))return false;seen.add(k);return true})
  .map(({score,matches,description,...x})=>x);
}
function value(b,t){const m=b.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${t}>`,'i'));return decode(m?.[1]||'').trim()}
function link(b){const t=value(b,'link');if(/^https?:\/\//i.test(t))return t;return decode(b.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1]||'').trim()}
function strip(s){return decode(s).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}
function decode(s){return String(s||'').replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')}
function clean(v,n){return String(v||'').replace(/[<>]/g,'').trim().slice(0,n)}
function oneOf(v,a,d){return a.includes(v)?v:d}
function response(data,status){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=60, stale-while-revalidate=240','access-control-allow-origin':'*'}})}
