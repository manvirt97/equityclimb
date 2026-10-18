// EquityClimb Market Intelligence endpoint v4.1
// Fix: manual refresh never fails just because a strict category has no matches.
// It returns the most relevant available items and marks strictMatch=false on fallbacks.

const CBC_REGIONAL={calgary:'https://www.cbc.ca/webfeed/rss/rss-canada-calgary',edmonton:'https://www.cbc.ca/webfeed/rss/rss-canada-edmonton',vancouver:'https://www.cbc.ca/webfeed/rss/rss-canada-britishcolumbia',victoria:'https://www.cbc.ca/webfeed/rss/rss-canada-britishcolumbia',toronto:'https://www.cbc.ca/webfeed/rss/rss-canada-toronto',ottawa:'https://www.cbc.ca/webfeed/rss/rss-canada-ottawa',montreal:'https://www.cbc.ca/webfeed/rss/rss-canada-montreal',winnipeg:'https://www.cbc.ca/webfeed/rss/rss-canada-manitoba',regina:'https://www.cbc.ca/webfeed/rss/rss-canada-saskatchewan',saskatoon:'https://www.cbc.ca/webfeed/rss/rss-canada-saskatoon',halifax:'https://www.cbc.ca/webfeed/rss/rss-canada-novascotia'};
const CATEGORY={
 realestate:{terms:['real estate','housing','home sales','home price','house price','mortgage','rent','rental','condo','construction','development','zoning','property','vacancy','housing starts']},
 corpdev:{terms:['acquisition','acquired','merger','transaction','divestiture','strategic review','joint venture','partnership','asset sale','takeover','deal','offtake','investment']},
 capital:{terms:['earnings','financial results','guidance','investor day','dividend','buyback','debt','bond','credit rating','equity offering','financing','capex','free cash flow','ebitda','revenue','material change']},
 opportunities:{terms:['rfp','tender','procurement','grant','incentive','funding','land sale','development permit','infrastructure','housing program','construction project','expansion','major project','contract awarded']},
 finance:{terms:['interest rate','rates','inflation','bank of canada','federal reserve','bond yield','mortgage rate','economy','economic','employment','unemployment','gdp','oil price','currency','credit']},
 government:{terms:['budget','tax','tariff','regulation','legislation','zoning','immigration','housing policy','mortgage rule','osfi','cmhc','bank of canada','finance canada','government funding','government announces']}
};
export async function onRequestGet({request}){
 const p=new URL(request.url).searchParams;
 const scope=pick(p.get('scope'),['local','province','national','global'],'national');
 const category=pick(p.get('category'),Object.keys(CATEGORY),'realestate');
 const city=clean(p.get('city')||'Calgary',60),region=clean(p.get('region')||'Alberta',60),cc=clean(p.get('country')||'CA',3).toUpperCase();
 const sources=sourcesFor(scope,category,city,region,cc);
 const settled=await Promise.allSettled(sources.map(fetchFeed));
 const all=[],sourceStatus=[];
 settled.forEach((r,i)=>{if(r.status==='fulfilled'){all.push(...r.value);sourceStatus.push({source:sources[i].name,ok:true,count:r.value.length})}else{sourceStatus.push({source:sources[i].name,ok:false,error:String(r.reason).slice(0,120)})}});
 const items=rank(all,{scope,category,city,region});
 return out({scope,category,items:items.slice(0,16),fetched:new Date().toISOString(),sourceStatus,partial:sourceStatus.some(s=>!s.ok)},200);
}
function sourcesFor(scope,category,city,region,cc){
 const terms=CATEGORY[category].terms.slice(0,10);
 const geo=scope==='local'?`\"${city}\"`:scope==='province'?`\"${region}\"`:scope==='national'?(cc==='CA'?'Canada':cc):'';
 // Two focused search feeds improve hit-rate while other publisher feeds provide fallback.
 const mk=(tail,name)=>({name,url:`https://news.google.com/rss/search?q=${encodeURIComponent([geo,tail,'when:7d'].filter(Boolean).join(' '))}&hl=en-CA&gl=CA&ceid=CA:en`});
 const focused=mk(`(${terms.map(t=>`\"${t}\"`).join(' OR ')})`,'Google News focused');
 const broad=mk(category==='realestate'?'(housing OR mortgage OR rent OR development)':terms.slice(0,4).join(' OR '),'Google News broad');
 const business={name:'CBC Business',url:'https://www.cbc.ca/webfeed/rss/rss-business'},canada={name:'CBC Canada',url:'https://www.cbc.ca/webfeed/rss/rss-canada'},world={name:'CBC World',url:'https://www.cbc.ca/webfeed/rss/rss-world'},global={name:'Global News',url:'https://globalnews.ca/feed/'};
 const local={name:`CBC ${city}`,url:CBC_REGIONAL[city.toLowerCase().replace(/[^a-z]/g,'')]||canada.url};
 if(scope==='local')return[focused,broad,local,business,global];
 if(scope==='province')return[focused,broad,local,canada,business];
 if(scope==='global')return[focused,broad,world,business,global];
 return[focused,broad,business,canada,global];
}
async function fetchFeed(s){
 const c=new AbortController(),timer=setTimeout(()=>c.abort(),5000);
 try{const r=await fetch(s.url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; EquityClimb/4.1; +https://equityclimb.pages.dev)','Accept':'application/rss+xml, application/atom+xml, application/xml, text/xml, */*','Accept-Language':'en-CA,en;q=0.9'},redirect:'follow',signal:c.signal});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);const x=await r.text();if(!x.includes('<item')&&!x.includes('<entry'))throw new Error('Not RSS/Atom');return parse(x,s.name)}finally{clearTimeout(timer)}}
function parse(xml,fallback){return[...xml.matchAll(/<(?:item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:item|entry)>/gi)].map(m=>m[1]).map(b=>{const source=val(b,'source')||fallback;let title=val(b,'title');if(source&&title.endsWith(' - '+source))title=title.slice(0,-source.length-3);return{title,link:lnk(b),source,date:val(b,'pubDate')||val(b,'published')||val(b,'updated')||new Date().toISOString(),description:strip(val(b,'description')||val(b,'summary'))}}).filter(x=>x.title&&/^https?:\/\//i.test(x.link))}
function rank(items,{scope,category,city,region}){
 const terms=CATEGORY[category].terms,seen=new Set();
 const scored=items.map(x=>{const h=`${x.title} ${x.description}`.toLowerCase(),matches=terms.filter(t=>h.includes(t));let score=matches.length*8;if(scope==='local'&&h.includes(city.toLowerCase()))score+=12;if(scope==='province'&&h.includes(region.toLowerCase()))score+=10;const hours=Math.max(0,(Date.now()-new Date(x.date))/36e5);score+=Math.max(0,8-hours/12);return{...x,category,strictMatch:matches.length>0,score}}).sort((a,b)=>b.score-a.score||new Date(b.date)-new Date(a.date));
 const strict=scored.filter(x=>x.strictMatch),pool=strict.length>=4?strict:[...strict,...scored.filter(x=>!x.strictMatch)];
 return pool.filter(x=>{const k=x.title.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,90);if(!k||seen.has(k))return false;seen.add(k);return true}).map(({description,score,...x})=>x)
}
function val(b,t){const m=b.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${t}>`,'i'));return dec(m?.[1]||'').trim()}function lnk(b){const t=val(b,'link');if(/^https?:\/\//i.test(t))return t;return dec(b.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1]||'').trim()}function strip(s){return dec(s).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}function dec(s){return String(s||'').replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')}function clean(v,n){return String(v||'').replace(/[<>]/g,'').trim().slice(0,n)}function pick(v,a,d){return a.includes(v)?v:d}function out(d,status){return new Response(JSON.stringify(d),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=30, stale-while-revalidate=90','access-control-allow-origin':'*'}})}
