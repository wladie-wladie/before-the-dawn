// Снимки всех экранов: node dev/shots.js <url> <outdir> [w h]
const {chromium}=require('playwright');
const [,,url,out,W='1600',H='900']=process.argv;
(async()=>{const b=await chromium.launch({args:['--no-sandbox','--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:+W,height:+H},deviceScaleFactor:1});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{try{localStorage.clear();localStorage.setItem('btd-view','3d')}catch(e){}});
 await p.goto(url);await p.waitForTimeout(5500);
 const shot=async n=>{await p.waitForTimeout(900);await p.screenshot({path:`${out}/${W}_${n}.png`})};
 const btn=t=>p.getByRole('button',{name:t}).first();
 await shot('00_home');await btn(/Новая игра/).click();await p.locator('.su-card').first().click();await shot('02_setup');
 await btn('Дальше').click();await p.locator('.su-big').first().click();await btn('Дальше').click();
 await p.locator('.su-rule').nth(1).click();await p.locator('.su-rule').nth(3).click();await shot('02b_rules');await btn('Дальше').click();
 await p.locator('.su-preds .su-card').nth(1).click();await shot('02c_pred');await btn('Выйти в ночь').click();await shot('03a_reveal');await p.waitForTimeout(6000);await btn('Начать ночь').click();
 await shot('03_intro');await btn('Понятно').click();await shot('04_walk');
 await p.evaluate(()=>{const m=me();for(let i=0;i<4;i++)m.hand.push({...m.hand[0],id:'x'+i,k:['c','i','p','c'][i],name:['Бармен','Ключ от склада','Подвал','Таксист'][i]});render()});
 for(const t of ['finds','sheet','court','log']){await p.evaluate(t=>setTab(t),t);await shot('05_tab_'+t)}
 await p.evaluate(()=>setTab('dossier'));
 // сцена
 await p.evaluate(()=>{act('search')});await shot('06_scene');await p.evaluate(()=>{const E=me().enc;if(E&&E.e&&E.e.c){const i=E.e.c.findIndex(c=>c.ok);if(i>=0)act('choose',{i})}});await shot('06b_roll');await p.evaluate(()=>homeOpen('settings'));await shot('06c_home_settings');await p.evaluate(()=>homeClose());
 await p.evaluate(()=>{const m=me();if(m.enc){for(let i=0;i<3&&m.enc;i++){if(m.enc.res)act('close');else act('choose',{i:0})}}});
 // выбор карты
 await p.evaluate(()=>{pickFor('rumor')});await shot('07_pick');await p.evaluate(()=>{UI.pick=null;render()});
 // сбор двора: ночь 2 в Элизиуме
 await p.evaluate(()=>{G.night=2;G.time=CONFIG.gFrom;const m=me();m.pos='0,0';m.seen.add('0,0');m.introDone=true;if(!G.case&&typeof openCase==='function')openCase();render()});await shot('08_elysium');
 await p.evaluate(()=>{const o=options(ME).find(o=>o.cmd==='courtEnter');if(o)act('courtEnter')});await shot('09_court');
 for(let i=0;i<30;i++){const ph=await p.evaluate(()=>G.court&&G.court.phase);if(!ph||ph==='turns'||ph==='sheriff')break;await p.evaluate(()=>{const b=document.querySelector('#court .ct-act button');b&&b.click()});await p.waitForTimeout(150)}
 await p.evaluate(()=>{const c=me().hand[0];c&&cSel(c.id)});await shot('10_court_turn');
 // предупреждение о рассвете
 await p.evaluate(()=>{if(G.phase!=='walk'){G.court=null;G.phase='walk'};const m=me();m.pos=nbrs(m.haven)[0];G.time=CONFIG.nightEnd-2;UI.alert={lvl:2,left:2,need:2};render()});await shot('11_dawn');
 await p.evaluate(()=>{UI.alert=null;UI.sun={kind:'meld',night:G.night,text:'Вы зарываетесь в землю.'};render()});await shot('12_sun');
 await p.evaluate(()=>{UI.sun=null;G.phase='day';render()});await shot('13_day');
 await p.evaluate(()=>{G.phase='end';G.result='done';render()});await shot('14_end');
 console.log('errors',errs.length?errs:'none');await b.close()})();
