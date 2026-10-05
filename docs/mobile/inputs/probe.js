const {chromium,devices}=require('playwright');const fs=require('fs');const M=__dirname;
(async()=>{const b=await chromium.launch();const ctx=await b.newContext(devices['iPhone 13']);const page=await ctx.newPage();
 await page.route('**/leaflet@1.9.4/dist/**',r=>{const f=r.request().url().split('/dist/')[1].split('?')[0];const p=M+'/cdn/package/dist/'+f;fs.existsSync(p)?r.fulfill({path:p}):r.abort()});
 await page.route('**/three.js/r128/three.min.js',r=>r.fulfill({path:M+'/cdn/three/package/build/three.min.js'}));
 await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await page.goto('http://localhost:8544/maps-site/#x');await page.waitForFunction(()=>window.ATLAS&&ATLAS.ready);
 console.log(await page.evaluate(()=>{const m=ATLAS.find('Epēshu');return [typeof m, m&&Object.keys(m).slice(0,15), m&&m.getLatLng&&m.getLatLng(), Array.isArray(ATLAS.markers)?ATLAS.markers.length:typeof ATLAS.markers, [...document.querySelectorAll('.leaflet-control-container *')].map(e=>e.className).filter(c=>typeof c==='string'&&c).filter((c,i,a)=>a.indexOf(c)===i).join(' | ')]}));
 await b.close()})()
