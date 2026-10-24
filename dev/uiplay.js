// Проверка через интерфейс: игра нажимает кнопки, как человек. node uiplay.js <page> <clan> <steps>
const {chromium}=require('playwright');
const [,,page,clan='tor',N='300']=process.argv;
(async()=>{const b=await chromium.launch({args:['--no-sandbox','--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const p=await b.newPage({viewport:{width:1400,height:950}});
 const errs=[],warns=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='warning')warns.push(m.text())});
 await p.addInitScript(()=>{try{localStorage.clear()}catch(e){};window.BTD_TEST=1;try{localStorage.setItem('btd-view','2d')}catch(e){}});await p.goto(page.startsWith('http')?page:'file://'+page);await p.waitForTimeout(5200);
 const btn=t=>p.getByRole('button',{name:t}).first();
 
 const names={tor:'Тореадор',ven:'Вентру',nos:'Носферату',bru:'Бруха',tre:'Тремер',gan:'Гангрел',tzi:'Цимисх'};
 await p.locator('.su-card').filter({hasText:names[clan]}).first().click();await btn('Дальше').click();
 await p.locator('.su-big').first().click();await btn('Дальше').click();await p.locator('.su-big').nth(1).click();await btn('Выйти в ночь').click();await p.waitForTimeout(500);await p.evaluate(()=>endReveal());
 await btn('Понятно').click();
 const seen={};let walked=0;
 for(let i=0;i<Number(N);i++){
  const st=await p.evaluate(()=>({ph:G.phase,ovl:!document.getElementById('ovl').hidden,ct:!document.getElementById('court').hidden,enc:!document.getElementById('scene').hidden||!!document.querySelector('#side .enc'),night:G.night,walking:UI.path.length}));
  if(st.walking){await p.waitForTimeout(400);continue}
  let clicked=null;
  const tryClick=async sel=>{const l=p.locator(sel);const n=await l.count();const ok=[];for(let j=0;j<n;j++){if(await l.nth(j).isEnabled()&&await l.nth(j).isVisible())ok.push(j)}if(!ok.length)return null;const j=ok[Math.floor(Math.random()*ok.length)];const t=(await l.nth(j).innerText()).trim().split('\n')[0];await l.nth(j).click();return t};
  if(st.ovl){clicked=await tryClick('#ovl button')}
  else if(st.ct){clicked=await tryClick('#court .slot .sl-a button')||(Math.random()<.5?await tryClick('#court .ct-hand button'):null)||await tryClick('#court .ct-act button')}
  else if(st.ph==='day'){clicked=await tryClick('#side .pn button.go')}
  else if(st.ph==='end'){clicked='END';break}
  else if(st.enc){clicked=await tryClick('#scene button, #side .enc button')}
  else if((await p.getByRole('button',{name:/Идти в Элизиум|Войти в галерею|Ждать сбора|В галерею/}).count())&&Math.random()<.8){clicked=await tryClick('#side button.go:is(:text("Идти в Элизиум"),:text("Войти в галерею")), #bar button:is(:text("Ждать сбора"),:text("В галерею"))')}
  else if(Math.random()<.45){const k=await p.evaluate(()=>{const n=nbrs(me().pos);return n[Math.floor(Math.random()*n.length)]});await p.locator(`#hits polygon[data-k="${k}"]`).dispatchEvent('click');clicked='hex '+k;walked++}
  else clicked=await tryClick('#bar .acts > .act, #side .pn button.go, #side .pn .choices button, #side .pn .t-btn');
  if(clicked){const key=clicked.replace(/[\d·:]+/g,'').trim().slice(0,30);seen[key]=(seen[key]||0)+1}
  if(i===40||i===120)await p.screenshot({path:'g_'+i+'.png'});await p.waitForTimeout(60)}
 const fin=await p.evaluate(()=>G.phase+' ночь '+G.night+' '+fmtTime(G.time)+' карт '+me().hand.length);
 console.log(clan,fin,'шагов по карте',walked);console.log(Object.entries(seen).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+':'+v).join(' | '));
 console.log('errors',errs.length?errs:'none');if(warns.length)console.log('refused',warns.slice(0,8));await b.close()})();
