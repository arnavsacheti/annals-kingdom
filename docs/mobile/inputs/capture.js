const {chromium,devices}=require('playwright');
const fs=require('fs'),path=require('path');
const M=__dirname;
const PROFILES=[
 {key:'iphone13',opts:{...devices['iPhone 13']},touch:true},
 {key:'pixel7',opts:{...devices['Pixel 7']},touch:true},
 {key:'desktop',opts:{viewport:{width:1366,height:768},deviceScaleFactor:1},touch:false},
 {key:'iphone13-slow4g',opts:{...devices['iPhone 13']},touch:true,throttle:{offline:false,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8,latency:150},shots:false},
];
const only=process.argv[2];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const MEASURE=`(()=>{
 const vw=innerWidth,vh=innerHeight;
 const vis=(el)=>{const r=el.getBoundingClientRect();if(r.width<=0||r.height<=0)return null;
   const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity===0)return null;
   if(r.right<=0||r.bottom<=0||r.left>=vw||r.top>=vh)return null;
   // covered by the contents overlay or a dialog? use elementFromPoint at centre
   const cx=Math.min(Math.max(r.left+r.width/2,0),vw-1),cy=Math.min(Math.max(r.top+r.height/2,0),vh-1);
   const top=document.elementFromPoint(cx,cy);
   const covered=!(top&&(top===el||el.contains(top)||top.contains(el)));
   return {r,covered};};
 const sel=(el)=>{let s=el.tagName.toLowerCase();if(el.id)s+='#'+el.id;
   const c=(typeof el.className==='string'?el.className:(el.className&&el.className.baseVal)||'').trim().split(/\\s+/).filter(Boolean).slice(0,3);
   if(c.length)s+='.'+c.join('.');
   if(el.tagName==='A'&&el.getAttribute('href'))s+='[href='+el.getAttribute('href').slice(0,30)+']';
   return s;};
 const out={vw,vh,sw:document.scrollingElement.scrollWidth,sh:document.scrollingElement.scrollHeight,
   hOverflow:document.scrollingElement.scrollWidth>innerWidth, bodySW:document.body.scrollWidth};
 // elements that poke past the viewport right edge (visible, not map internals)
 const poke=[];
 document.querySelectorAll('body *').forEach(el=>{if(el.closest('#map .leaflet-pane,#map .leaflet-map-pane,.leaflet-tile-container'))return;
   const r=el.getBoundingClientRect();if(r.width>0&&r.right>vw+1&&getComputedStyle(el).position!=='fixed'){const cs=getComputedStyle(el);if(cs.display!=='none'&&cs.visibility!=='hidden'&&!el.closest('[hidden]'))poke.push(sel(el)+' right='+Math.round(r.right));}});
 out.pokes=poke.slice(0,8);
 const cand=document.querySelectorAll('a[href],button,input,select,textarea,summary,label,[role=button],[tabindex]:not([tabindex="-1"]),.mk .glyph,.leaflet-control-layers-toggle,.leaflet-control-zoom a,.leaflet-marker-icon.leaflet-interactive');
 const small=[],all=[];
 cand.forEach(el=>{
   if(el.tagName==='LABEL'&&!el.querySelector('input'))return;
   const v=vis(el);if(!v)return;
   if(v.covered&&!document.getElementById('contents').hidden&&!el.closest('#contents'))return; // under the contents overlay
   const w=v.r.width,h=v.r.height;
   // a marker wrapper with 0-size content is skipped by vis; glyph is the hit target
   if(el.classList.contains('leaflet-marker-icon')&&el.querySelector('.glyph'))return;
   const rec={s:sel(el),w:+w.toFixed(1),h:+h.toFixed(1),t:(el.textContent||el.getAttribute('aria-label')||el.title||'').trim().slice(0,24)};
   all.push(rec);
   if(w<44||h<44)small.push(rec);});
 // aggregate by selector
 const agg={};small.forEach(x=>{const a=agg[x.s]||(agg[x.s]={selector:x.s,count:0,minW:1e9,minH:1e9,maxW:0,maxH:0,sample:x.t});
   a.count++;a.minW=Math.min(a.minW,x.w);a.minH=Math.min(a.minH,x.h);a.maxW=Math.max(a.maxW,x.w);a.maxH=Math.max(a.maxH,x.h);});
 out.interactiveTotal=all.length;out.smallTargets=Object.values(agg);out.smallCount=small.length;
 // markers/labels
 let mk=0,mkCovered=0,lbl=0,tip=0;const mkTypes={};
 const ctsOpen=!document.getElementById('contents').hidden;let behind=0;
 document.querySelectorAll('#map .mk').forEach(el=>{const g=el.querySelector('.glyph')||el;const v=vis(g);if(!v)return;if(ctsOpen){behind++;return;}mk++;
   const t=(el.className.match(/t-\\w+/)||['other'])[0];mkTypes[t]=(mkTypes[t]||0)+1;
   const l=el.querySelector('.lbl');if(l){const lv=vis(l);if(lv&&getComputedStyle(l).display!=='none'&&l.textContent.trim())lbl++;}});
 document.querySelectorAll('#map .leaflet-tooltip').forEach(el=>{if(vis(el))tip++;});
 const vec=[...document.querySelectorAll('#map path.leaflet-interactive')].filter(p=>vis(p)).length;
 const otherMarkers=[...document.querySelectorAll('#map .leaflet-marker-icon')].filter(e=>!e.querySelector('.mk')&&vis(e)).length;
 out.markersBehindContentsOverlay=behind;out.markers=mk;out.markerTypes=mkTypes;out.labels=lbl;out.tooltips=tip;out.vectorPaths=vec;out.otherMarkerIcons=otherMarkers;
 out.tilesLoaded=document.querySelectorAll('#map img.leaflet-tile-loaded').length;
 out.tilesLoading=document.querySelectorAll('#map .leaflet-tile-loading').length;
 try{const sa=document.getElementById('stage').getBoundingClientRect();out.stageRect=[Math.round(sa.top),Math.round(sa.height)];out.mapHeightPctOfViewport=Math.round(100*sa.height/vh);const hd=document.querySelector('header').getBoundingClientRect();out.headerHeight=Math.round(hd.height);
  const rs=[...document.querySelectorAll('#map .leaflet-control,#map .strip,.strip,#jbar:not([hidden]),.grp-btn,.scalebar,.era-ctrl,.jrn-ctrl')].map(e=>e.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);
  const cell=4;let cov=0,tot=0;for(let y=Math.max(sa.top,0);y<Math.min(sa.bottom,vh);y+=cell)for(let x=0;x<vw;x+=cell){tot++;if(rs.some(r=>x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom))cov++;}out.mapAreaCoveredByControlsPct=tot?Math.round(100*cov/tot):null;
  const mb=ATLAS.map.getBounds(),mx=ATLAS.map.options.maxBounds;if(mx){const z=ATLAS.map.getZoom();const p1=ATLAS.map.project(mb.getSouthWest(),z),p2=ATLAS.map.project(mb.getNorthEast(),z);const q1=ATLAS.map.project(mx.getSouthWest(),z),q2=ATLAS.map.project(mx.getNorthEast(),z);out.visibleFractionOfChart=+(Math.min(1,(Math.abs(p2.x-p1.x)*Math.abs(p2.y-p1.y))/(Math.abs(q2.x-q1.x)*Math.abs(q2.y-q1.y)))).toFixed(3);}
 }catch(e){out.measureErr=String(e);}
 try{out.zoom=ATLAS.map.getZoom();out.minZoom=ATLAS.map.getMinZoom();out.maxZoom=ATLAS.map.getMaxZoom();}catch(e){}
 return out;})()`;

async function run(P){
 const b=await chromium.launch();
 const ctx=await b.newContext(P.opts);
 const page=await ctx.newPage();
 const cdp=await ctx.newCDPSession(page);
 await cdp.send('Network.enable');
 if(P.throttle){await cdp.send('Network.emulateNetworkConditions',P.throttle);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
 const reqs={};const tot={};let marker=0;
 const cat=u=>{const p=new URL(u).pathname;
   if(/\/tiles(-imperial|-war)?\//.test(p))return 'tiles';if(/\/charts\//.test(p))return 'charts';
   if(/\/art\//.test(p))return 'art';if(/\/data\//.test(p))return 'data';
   if(/leaflet/.test(u))return 'leaflet';return 'html/other';};
 const bytes={};      // cumulative by cat
 cdp.on('Network.requestWillBeSent',e=>{reqs[e.requestId]={url:e.request.url,t:e.timestamp,wall:e.wallTime};});
 cdp.on('Network.responseReceived',e=>{if(reqs[e.requestId]){reqs[e.requestId].status=e.response.status;reqs[e.requestId].fromRoute=e.response.url&&false;}});
 cdp.on('Network.loadingFinished',e=>{const r=reqs[e.requestId];if(!r)return;r.done=e.timestamp;r.bytes=e.encodedDataLength;
   if(!/^https?:\/\/localhost/.test(r.url))return;const c=cat(r.url);bytes[c]=bytes[c]||{n:0,b:0};bytes[c].n++;bytes[c].b+=e.encodedDataLength;});
 const snap=()=>JSON.parse(JSON.stringify(bytes));
 const diff=(a,b2)=>{const o={};let tb=0,tn=0;for(const k of new Set([...Object.keys(a),...Object.keys(b2)])){const n=(b2[k]?.n||0)-(a[k]?.n||0),bb=(b2[k]?.b||0)-(a[k]?.b||0);o[k]={requests:n,bytes:bb};tb+=bb;tn+=n;}o.total={requests:tn,bytes:tb};return o;};
 const errs=[],failed=[],pageerrs=[];
 page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push({type:m.type(),text:m.text().slice(0,300),loc:(m.location()||{}).url});});
 page.on('pageerror',e=>pageerrs.push(e.message.slice(0,300)));
 page.on('requestfailed',r=>failed.push(r.url().slice(0,120)+' :: '+(r.failure()||{}).errorText));
 const dist=path.join(M,'cdn/leaflet/package/dist');
 await page.route('**/leaflet@1.9.4/dist/**',r=>{const u=new URL(r.request().url());const f=path.join(dist,u.pathname.split('/dist/')[1]);
   if(fs.existsSync(f)){const ct=f.endsWith('.css')?'text/css':f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':'application/octet-stream';r.fulfill({path:f,contentType:ct});}else r.abort();});
 await page.route('**/three.js/r128/three.min.js',r=>r.fulfill({path:path.join(M,'cdn/three/package/build/three.min.js'),contentType:'text/javascript'}));
 await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await page.addInitScript(()=>{window.__ft=null;window.__tiles=0;document.addEventListener('load',e=>{const t=e.target;if(t&&t.tagName==='IMG'&&t.classList&&t.classList.contains('leaflet-tile')){window.__tiles++;if(window.__ft==null)window.__ft=performance.now();}},true);
   window.__fdata=null;});
 const result={profile:P.key,viewport:null,views:{}};
 const t0=Date.now();
 await page.goto('http://localhost:8544/maps-site/?v='+(P.key==='iphone13'?1:Math.floor(Math.random()*1e6)+2),{waitUntil:'load'});
 await page.waitForFunction(()=>window.ATLAS&&window.ATLAS.ready,null,{timeout:120000});
 result.timeToAtlasReadyMs=Date.now()-t0;
 async function settle(extra=600,max=60000){ // wait for tiles + network quiet
   const s=Date.now();let quiet=0;
   while(Date.now()-s<max){
     const n=await page.evaluate(()=>document.querySelectorAll('#map .leaflet-tile-loading').length);
     const pend=Object.values(reqs).filter(r=>!r.done&&!r.failed&&/^https?:\/\/localhost/.test(r.url)).length;
     if(n===0&&pend===0){quiet+=100;if(quiet>=extra)return true;}else quiet=0;
     await sleep(100);}
   return false;}
 const ok0=await settle(800);
 result.firstLoadSettled=ok0;
 result.ttf=await page.evaluate(()=>{const nav=performance.getEntriesByType('navigation')[0];return {firstTileLoadedMs:window.__ft==null?null:Math.round(window.__ft),tilesLoadedCount:window.__tiles,domContentLoadedMs:Math.round(nav.domContentLoadedEventEnd),loadEventMs:Math.round(nav.loadEventEnd)};});
 // first tile network response time (relative to first nav request)
 const first=Object.values(reqs).filter(r=>r.url.includes('localhost')).sort((a,b)=>a.t-b.t);
 const navT=first[0].t;
 const tileReqs=first.filter(r=>cat(r.url)==='tiles'&&r.done);
 result.ttf.firstTileRequestStartMs=tileReqs.length?Math.round((tileReqs[0].t-navT)*1000):null;
 result.ttf.firstTileResponseDoneMs=tileReqs.length?Math.round((Math.min(...tileReqs.map(r=>r.done))-navT)*1000):null;
 const dataReqs=first.filter(r=>cat(r.url)==='data'&&r.done);
 result.ttf.allDataDoneMs=dataReqs.length?Math.round((Math.max(...dataReqs.map(r=>r.done))-navT)*1000):null;
 const sh=async(name)=>{if(P.shots===false)return;await page.screenshot({path:path.join(M,'shots',`${P.key}-${name}.png`)});};
 const view=async(name,extra={})=>{
   const m=await page.evaluate(MEASURE);
   result.views[name]={...m,...extra};
   await sh(name);};
 result.viewport=await page.evaluate(()=>({w:innerWidth,h:innerHeight,dpr:devicePixelRatio,coarse:matchMedia('(pointer:coarse)').matches,hover:matchMedia('(hover:hover)').matches}));
 const b0=snap();
 // ---- 1. contents
 const cinfo=await page.evaluate(()=>{const c=document.getElementById('contents');const inner=c.querySelector('.contents-inner');
   const t=c.querySelector('.contents-title').getBoundingClientRect(),k=c.querySelector('.contents-kicker').getBoundingClientRect();
   const last=c.querySelector('.contents-foot').getBoundingClientRect();
   const cards=[...c.querySelectorAll('.tcard')].map(x=>{const r=x.getBoundingClientRect();return [Math.round(r.top),Math.round(r.bottom)];});
   return {open:!c.hidden,scrollTop:c.scrollTop,innerScrollTop:inner.scrollTop,cScrollH:c.scrollHeight,cClientH:c.clientHeight,innerScrollH:inner.scrollHeight,innerClientH:inner.clientHeight,
     kickerTop:Math.round(k.top),titleTop:Math.round(t.top),footBottom:Math.round(last.bottom),cards,vh:innerHeight,activeEl:document.activeElement&&document.activeElement.className};});
 await view('1-contents',{contents:cinfo});
 const bytesAtContents=diff({},snap());
 result.firstLoadBytes=bytesAtContents;result.firstLoadBytesNote='all localhost responses (encodedDataLength via CDP) from navigation to settled Contents screen; fonts/CDN blocked or served from disk (not counted)';
 // ---- 2. whole chart
 const sA=snap();
 const card=page.locator('.tcard[data-theme=whole]');
 if(P.touch)await card.tap();else await card.click();
 await sleep(500);await settle(800);
 await view('2-whole-chart',{bytesDelta:diff(sA,snap())});
 // ---- 3. layers panel
 const sB=snap();
 const tog=page.locator('.leaflet-control-layers-toggle');
 let lay={};
 try{
   let tapOpened=null;
   if(P.touch){await tog.tap();await sleep(300);tapOpened=await page.evaluate(()=>document.querySelector('.leaflet-control-layers').classList.contains('leaflet-control-layers-expanded'));
     if(!tapOpened)await page.evaluate(()=>document.querySelector('.leaflet-control-layers').classList.add('leaflet-control-layers-expanded'));}   // Playwright touch emulation cannot open even a stock Leaflet collapsed control (verified on a bare page); class add == Control.Layers.expand()
   else {const bb=await tog.boundingBox();await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);}
   result.layersTapOpened=tapOpened;
   await sleep(500);
   lay=await page.evaluate(()=>{const lc=document.querySelector('.leaflet-control-layers');const l=lc.querySelector('.leaflet-control-layers-list');const r=l.getBoundingClientRect();
     const inputs=[...l.querySelectorAll('label')].map(x=>{const q=x.getBoundingClientRect();return [Math.round(q.width),Math.round(q.height)];});
     return {expanded:lc.classList.contains('leaflet-control-layers-expanded'),rect:{l:Math.round(r.left),t:Math.round(r.top),r:Math.round(r.right),b:Math.round(r.bottom),w:Math.round(r.width),h:Math.round(r.height)},vw:innerWidth,vh:innerHeight,
       fitsViewport:r.bottom<=innerHeight&&r.right<=innerWidth&&r.left>=0,overflowY:getComputedStyle(l).overflowY,scrollH:l.scrollHeight,clientH:l.clientHeight,rows:inputs.length,rowSizes:inputs.slice(0,6),
       checkbox:(()=>{const c=l.querySelector('input[type=checkbox]');if(!c)return null;const q=c.getBoundingClientRect();return [q.width,q.height];})(),
       labelFont:getComputedStyle(l.querySelector('label span')||l).fontSize};});
 }catch(e){lay={error:String(e).slice(0,200)};}
 await view('3-layers-panel',{layers:lay});
 // collapse: tap an empty part of the map
 try{ if(P.touch)await page.touchscreen.tap(8,Math.round(result.viewport.h/2)); else await page.mouse.move(5,300); await page.evaluate(()=>document.querySelector('.leaflet-control-layers').classList.remove('leaflet-control-layers-expanded')); }catch(e){}
 await sleep(400);
 // ---- 4. place card via tap on Epēshu marker
 const sC=snap();
 let place={};
 try{
   const info=await page.evaluate(()=>{const m=ATLAS.find('Epēshu');if(!m)return null;const mk=m._mk;const ll=mk.getLatLng();return {ll:[ll.lat,ll.lng],name:m.name,type:m.type};});
   place.found=!!info;
   // zoom so that Epēshu's pin is visible, centred slightly above to leave room for the card
   await page.evaluate(([la,ln])=>{ATLAS.map.setView([la,ln],Math.min(ATLAS.map.getMaxZoom(),ATLAS.map.getMinZoom()+2.6),{animate:false});},info.ll);
   await sleep(600);await settle(800);
   const pos=await page.evaluate(()=>{const m=ATLAS.find('Epēshu');const el=m._mk.getElement&&m._mk.getElement();const g=el&&el.querySelector('.glyph');if(!g)return null;const r=g.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,cls:el.querySelector('.mk').className};});
   place.glyph=pos;
   if(pos)place.stackAtTap=await page.evaluate(([x,y])=>document.elementsFromPoint(x,y).slice(0,6).map(e=>(e.tagName+'.'+(typeof e.className==='string'?e.className:'')).slice(0,60)+' "'+(e.textContent||'').trim().slice(0,14)+'"'),[pos.x,pos.y]);
   if(pos){ if(P.touch)await page.touchscreen.tap(pos.x,pos.y); else await page.mouse.click(pos.x,pos.y);}
   await sleep(1500);await settle(800);
   place.panel=await page.evaluate(()=>{const p=document.getElementById('panel');const r=p.getBoundingClientRect();const cs=getComputedStyle(p);const b=document.getElementById('panelBody');
     const pc=document.getElementById('panelClose').getBoundingClientRect();
     const imgs=[...p.querySelectorAll('img')].map(i=>({src:(i.currentSrc||i.src).split('/').slice(-2).join('/'),nw:i.naturalWidth,nh:i.naturalHeight,w:Math.round(i.getBoundingClientRect().width),h:Math.round(i.getBoundingClientRect().height)}));
     return {open:p.getAttribute('aria-hidden')==='false',rect:{l:Math.round(r.left),t:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)},vw:innerWidth,vh:innerHeight,
       coversPctOfViewportArea:Math.round(100*(Math.min(r.right,innerWidth)-Math.max(r.left,0))*(Math.min(r.bottom,innerHeight)-Math.max(r.top,0))/(innerWidth*innerHeight)),
       position:cs.position,bodyScrollH:b.scrollHeight,bodyClientH:b.clientHeight,closeBtn:[Math.round(pc.width),Math.round(pc.height)],
       h1:(p.querySelector('h2,h3')||{}).textContent,imgs,textLen:p.textContent.length,hash:location.hash};});
 }catch(e){place.error=String(e).slice(0,300);}
 await view('4-place-card',{place,bytesDelta:diff(sC,snap())});
 // close the card
 try{ if(P.touch)await page.locator('#panelClose').tap(); else await page.locator('#panelClose').click(); }catch(e){}
 await sleep(400);
 // ---- 4b. retap Epēshu at a deeper zoom (the first tap can land on an overlapping faction badge)
 try{ const sF=snap();const info2=await page.evaluate(()=>{const ll=ATLAS.find('Epēshu')._mk.getLatLng();return [ll.lat,ll.lng];});
  await page.evaluate(([la,ln])=>{ATLAS.map.setView([la,ln],ATLAS.map.getMinZoom()+4.2,{animate:false});},info2);await sleep(600);await settle(800);
  const pos2=await page.evaluate(()=>{const el=ATLAS.find('Epēshu')._mk.getElement();const g=el.querySelector('.glyph');const r=g.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height};});
  if(P.touch)await page.touchscreen.tap(pos2.x,pos2.y);else await page.mouse.click(pos2.x,pos2.y);
  await sleep(1500);await settle(800);
  const pn=await page.evaluate(()=>{const p=document.getElementById('panel');const r=p.getBoundingClientRect();return {open:p.getAttribute('aria-hidden')==='false',h1:(p.querySelector('h2,h3')||{}).textContent,rect:{t:Math.round(r.top),h:Math.round(r.height),w:Math.round(r.width)},coversPctOfViewportArea:Math.round(100*(Math.min(r.right,innerWidth)-Math.max(r.left,0))*(Math.min(r.bottom,innerHeight)-Math.max(r.top,0))/(innerWidth*innerHeight)),bodyScrollH:document.getElementById('panelBody').scrollHeight,bodyClientH:document.getElementById('panelBody').clientHeight,imgs:[...p.querySelectorAll('img')].map(i=>({src:(i.currentSrc||i.src).split('/').pop(),nw:i.naturalWidth,w:Math.round(i.getBoundingClientRect().width),h:Math.round(i.getBoundingClientRect().height)})),hash:location.hash};});
  await view('4b-place-card-epeshu',{place:{panel:pn,glyph:pos2},bytesDelta:diff(sF,snap())});
  try{ if(P.touch)await page.locator('#panelClose').tap(); else await page.locator('#panelClose').click(); }catch(e){}
  await sleep(400);
 }catch(e){result.views['4b-place-card-epeshu']={error:String(e).slice(0,300)};}
 // ---- 5. street zoom: #chart=Epēshu
 const sD=snap();
 const tS=Date.now();
 await page.evaluate(()=>{location.hash='#chart='+encodeURIComponent('Epēshu');});
 await sleep(1500);
 await settle(1500,90000);
 await sleep(1500);await settle(800,60000);
 const stz=await page.evaluate(()=>{const o={};try{o.zoom=ATLAS.map.getZoom();o.maxZoom=ATLAS.map.getMaxZoom();o.hash=location.hash;o.chartMode=document.getElementById('map').classList.contains('chart-mode');
   o.canvases=[...document.querySelectorAll('#map canvas')].map(c=>[c.width,c.height]).slice(0,6);
   o.bigImages=[...document.querySelectorAll('#map img')].filter(i=>i.naturalWidth>1000).map(i=>[i.src.split('/').slice(-2).join('/'),i.naturalWidth,i.naturalHeight]).slice(0,5);}catch(e){o.err=String(e)}return o;});
 await view('5-street-zoom-epeshu',{street:stz,streetSettleMs:Date.now()-tS,bytesDelta:diff(sD,snap())});
 // ---- 6. extra: zoomed in a bit more at street if possible via map API (max zoom) ----
 const sE=snap();
 try{ await page.evaluate(()=>{ATLAS.map.setZoom(ATLAS.map.getMaxZoom(),{animate:false});});
   await sleep(800);await settle(1000,60000);
   await view('6-street-maxzoom',{bytesDelta:diff(sE,snap())});}catch(e){}
 result.totalBytes=diff({},snap());
 result.pageScroll=await page.evaluate(()=>{window.scrollTo(0,500);return {scrollY:Math.round(scrollY),sh:document.scrollingElement.scrollHeight,vh:innerHeight};});
 await page.evaluate(()=>scrollTo(0,0));
 result.consoleErrors=errs;result.pageErrors=pageerrs;result.failedRequests=failed;
 result.status4xx=Object.values(reqs).filter(r=>r.status>=400).map(r=>r.status+' '+r.url.slice(0,120));
 result.slowest=Object.values(reqs).filter(r=>r.done&&/localhost/.test(r.url)).map(r=>({u:r.url.replace('http://localhost:8544',''),ms:Math.round((r.done-r.t)*1000),b:r.bytes})).sort((a,b)=>b.b-a.b).slice(0,10);
 // repeat visit: fresh page in the same context (HTTP cache warm)
 if(P.shots!==false){const p2=await ctx.newPage();const c2=await ctx.newCDPSession(p2);await c2.send('Network.enable');let rb=0,rn=0,cached=0;const rq={};
  c2.on('Network.requestWillBeSent',e=>{rq[e.requestId]=e.request.url;});c2.on('Network.requestServedFromCache',e=>{cached++;});c2.on('Network.loadingFinished',e=>{if(/localhost/.test(rq[e.requestId]||'')){rn++;rb+=e.encodedDataLength;}});
  await p2.route('**/leaflet@1.9.4/dist/**',r=>{const u=new URL(r.request().url());const f=path.join(dist,u.pathname.split('/dist/')[1]);fs.existsSync(f)?r.fulfill({path:f,contentType:f.endsWith('.css')?'text/css':f.endsWith('.js')?'text/javascript':'image/png'}):r.abort();});
  await p2.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await p2.goto('http://localhost:8544/maps-site/?v=repeat');await p2.waitForFunction(()=>window.ATLAS&&window.ATLAS.ready,null,{timeout:60000});await sleep(2500);
  result.repeatVisit={requestsOverNetworkWithBytes:rn,bytes:rb,servedFromMemoryCache:cached};await p2.close();}
 await b.close();
 return result;
}
(async()=>{
 const out={};
 for(const P of PROFILES){if(only&&only!==P.key)continue;
   try{out[P.key]=await run(P);console.error('done',P.key);}catch(e){out[P.key]={error:String(e.stack||e).slice(0,800)};console.error('FAIL',P.key,e);}
   fs.writeFileSync(path.join(M,'atlas-capture-metrics.json'),JSON.stringify(out,null,1));}
})();
