const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONS',m.text())});
const D='/home/user/speed-game/docs/stile/';
for(const k of ['notte','editoriale','vetro','oro']){for(const t of ['home','sala']){await p.goto('http://localhost:8123/docs/stile/'+k+'-'+t+'.html',{waitUntil:'networkidle'});await p.waitForTimeout(300);await p.screenshot({path:D+k+'-'+t+'.png'});}
await p.goto('http://localhost:8123/docs/stile/'+k+'-colori.html',{waitUntil:'networkidle'});await p.waitForTimeout(300);await (await p.$('.sch')).screenshot({path:D+k+'-colori.png'});}
const q=await b.newPage({viewport:{width:1720,height:1000}});await q.goto('http://localhost:8123/docs/stile/confronto.html',{waitUntil:'networkidle'});await q.screenshot({path:D+'confronto.png',fullPage:true});await b.close();})();
