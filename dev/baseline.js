// эталонные экраны: node baseline.js <page> <outdir> <adapter: v1|v2>
const {chromium}=require('playwright');
const [,,page,out,ver]=process.argv;
const A={ // адаптеры состояний, которые долго набивать кликами
 v1:{court:`G.night=2;G.time=46;G.pos='0,0';for(const b of G.B)b.status=1;G.status=5;startCourt()`,listen:`G.court.phase='turns';courtAdvance();render()`,
     alert:`G.court=null;G.phase='walk';G.time=50;const far=Object.keys(G.city.map).filter(k=>G.city.map[k].t!=='river').sort((a,c)=>hexDist(c,G.haven)-hexDist(a,G.haven))[0];G.pos=far;reveal(far);G.warn1=0;G.warn2=0;G.time=60-homeNeed()-3;dawnWarnCheck();render()`,
     sun:`G.alert=null;G.deathMode='respawn';G.time=60;dawn()`,day:`G.sunScene=null;render()`},
 v2:{court:`G.night=2;G.time=46;const m=me();m.pos='0,0';for(const b of bots())b.status=1;m.status=5;startCourt();render()`,listen:`act('courtListen')`,
     alert:`G.court=null;G.phase='walk';const m=me();const far=Object.keys(G.city.map).filter(k=>G.city.map[k].t!=='river').sort((a,c)=>hexDist(c,m.haven)-hexDist(a,m.haven))[0];m.pos=far;reveal(m,far);m.warn1=0;m.warn2=0;G.time=60-homeNeed(m)-3;const e=dawnWarnCheck(m);react({events:[e]});render()`,
     sun:`UI.alert=null;G.deathMode='respawn';G.time=60;const n=G.evN;dawn();react({events:G.ev.filter(e=>e.n>n)});render()`,day:`UI.sun=null;render()`}}[ver];
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const errs=[];
for(const [w,h,n] of [[1400,950,'d'],[400,860,'m']]){
 const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errs.push(n+': '+e.message));
 await p.addInitScript(()=>{let s=12345;Math.random=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};try{localStorage.clear()}catch(e){}});
 await p.goto('file://'+page);await p.waitForTimeout(5200);
 const shot=async k=>{await p.waitForTimeout(450);await p.screenshot({path:`${out}/${n}-${k}.png`})};
 const click=async t=>{const el=p.getByRole('button',{name:t}).first();await el.scrollIntoViewIfNeeded();await el.click()};
 await shot('01gen');
 await click('Войти в город');await shot('02clan');
 await p.locator('.su-card').filter({hasText:'Тореадор'}).first().click();await click('Дальше');await shot('03fac');
 await p.locator('.su-big').filter({hasText:'Камарилья'}).first().click();await click('Дальше');await shot('04death');
 await p.locator('.su-big').filter({hasText:'Окончательная'}).first().click();await click('Выйти в ночь');await shot('05walk');
 await click('Понятно');await shot('06walk2');
 await click(/Осмотреться/);await shot('07enc');
 await p.locator('.enc .choices button').first().click();await shot('08res');
 await click('Дальше');await shot('09after');
 await p.evaluate(A.court);await shot('10court');
 await p.evaluate(A.listen);await shot('11turns');
 await p.evaluate(A.alert);await shot('12alert');
 await p.evaluate(A.sun);await p.waitForTimeout(2600);await shot('13sun');
 await p.evaluate(A.day);await shot('14day');
 await p.close()}
console.log(errs.length?errs:'ok');await b.close()})();
