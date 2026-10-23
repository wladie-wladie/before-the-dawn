
/* ============================ БОТЫ-СОПЕРНИКИ ============================
   Боты решают сами, но действуют только командами — теми же, что и человек. */
function mkBot(i,clan,haven){const a=mkPlayer("b"+i,"bot",clan,haven);a.fac=Math.random()<CLANS[clan].lean?"ana":"cam";
  Object.assign(a,{busy:0,met:0,attend:true,target:null,grudge:0,wantE:false});
  a.hand.push(dirtyCard(a));const g=pick(GOALS);a.goal=g.id;if(g.id==="punish")a.goalX=pick(Object.keys(CLANS).filter(c=>c!==clan));return a}
const botAct=(b,name,args,ctx)=>dispatch(b.id,name,args,ctx).ok;
function botMove(b,to){if(!to||to===b.pos)return;const p=bfs(b.pos,to,null);if(p&&p.length)botAct(b,"move",{to:p[0]})}
function botTarget(b){const near=Object.values(G.city.map).filter(h=>h.t!=="river"&&hexDist(h.k,b.pos)<=3&&h.k!==b.pos);
  const score=h=>{let s=Math.random()*2;if(b.searched[h.k]!==G.night)s+=2;const D=G.dist[h.k];if(D&&D.own!==b.fac)s+=1.5;return s};
  return near.sort((x,y)=>score(y)-score(x))[0].k}
function wantsPlace(b){const C=G.case;if(!C)return null;let best=null,bs=0;
  for(const cell of freeCells())for(const card of b.hand){if(!fits(card,cell)||card.hold)continue;let s=1;
    if(cell.who){if(card.clan===b.clan||card.dirty&&card.clan===b.clan)continue;if(card.clan==="mortal")s-=.5;
      const t=actorOfClan(card.clan);if(t&&t.control==="human")s+=b.grudge*.8;if(t)s+=t.status*.2;if(b.goal==="punish"&&card.clan===b.goalX)s+=3}
    else if(card.clan===b.clan)s-=.6;
    for(const v of Object.values(C.cells)){if(card.clan&&v.card.clan===card.clan&&card.clan!=="mortal")s+=.8;if(hexDist(card.d,v.card.d)<=1)s+=.8}
    if(s>bs){bs=s;best={cell,card}}}
  return best}
// ход бота с делом: на сборе (ctx.court — очередь уже его) или в Элизиуме между сборами
function botCourtTurn(b,lines,ctx={court:true}){const say=ok=>{if(ok){lines.push(G.log[0].t);return true}return false};
  if(accusedBy(b)){const c=b.hand.find(c=>c.clan===b.clan);if(c&&say(botAct(b,"alibi",{card:c.id},ctx)))return}
  const ex=exposeTargets(b);if(ex.length&&Math.random()<.7){if(say(botAct(b,"expose",{clan:pick(ex)},ctx)))return}
  const w=wantsPlace(b);if(w&&Math.random()<.85){if(say(botAct(b,"place",{cell:w.cell.id,card:w.card.id},ctx)))return}
  const wc=freeCells().find(c=>c.who);if(wc){const L=leader(wc);if(L&&L.key===b.clan){const c=b.hand.find(c=>c.clan&&c.clan!==b.clan&&(c.clan)!==L.key);if(c&&say(botAct(b,"refute",{cell:wc.id,card:c.id},ctx)))return}}
  lines.push(`${Who(b)} молчит.`)}
function botSheriff(b,lines){const C=G.case;if(!C)return;const T=tplOf(C);
  for(const cell of T.cells){const v=C.cells[cell.id];if(!v)continue;const hurts=cell.who&&v.card.clan===b.clan;if(!hurts&&Math.random()>.25)continue;
    const c=b.hand.find(c=>fits(c,cell)&&(!cell.who||c.clan!==b.clan)&&!(c.dirty&&c.clan===b.clan));if(c&&botAct(b,"rewrite",{cell:cell.id,card:c.id})){lines.push(G.log[0].t);return}}}
// осмотр района теми же командами: осмотреться → выбрать → закрыть
function botSearch(b){if(!botAct(b,"search"))return;const E=b.enc;if(!E)return;
  if(!E.res){const ok=E.e.c.map((c,i)=>i).filter(i=>!E.e.c[i].dis);botAct(b,"choose",{i:pick(ok)})}
  botAct(b,"close")}
function botInfluence(b){if(!botAct(b,"influence"))return;const cs=b.enc.e.c;let i=0;
  const ci=cs.findIndex(c=>c.inf.card),mi=cs.findIndex(c=>c.inf.money&&!c.dis);
  if(ci>=0&&Math.random()<.5)i=ci;else if(mi>=0&&Math.random()<.5)i=mi;
  botAct(b,"choose",{i});botAct(b,"close")}
function botsStep(){
  for(const b of bots()){if(!b.alive)continue;if(b.busy>0){b.busy--;continue}
    const home=bfs(b.pos,b.haven,null);const hl=home?home.length:0;
    if(G.time>=CONFIG.nightEnd-hl-2){botMove(b,b.haven);continue}
    if(isGatherNight()&&b.attend&&G.gathered!==G.night&&G.time>=CONFIG.gFrom-4&&G.time<=CONFIG.gTo){botMove(b,"0,0");continue}
    if(b.hunger>=4){botAct(b,"hunt");continue}
    if(b.pos==="0,0"){if(G.case&&b.wantE&&G.phase!=="court"){b.wantE=false;botCourtTurn(b,[],{})}b.target=botTarget(b);botMove(b,b.target);continue}
    if(G.case&&!b.wantE&&wantsPlace(b)&&Math.random()<.12)b.wantE=true;
    if(b.wantE){botMove(b,"0,0");continue}
    const D=G.dist[b.pos];
    if(D&&b.searched[b.pos]!==G.night&&Math.random()<.65){botSearch(b);continue}
    if(D&&(D.own!==b.fac||Math.abs(D.c)<4)&&Math.random()<.4){botInfluence(b);continue}
    if(TALK.includes(G.city.map[b.pos].t)&&G.case&&Math.random()<.25){const c=b.hand.find(c=>c.k==="c"&&c.clan&&c.clan!==b.clan&&c.clan!=="mortal"&&!c.dirty);if(c&&botAct(b,"rumor",{card:c.id}))continue}
    if(b.clan==="tzi"&&!b.disguise&&b.disguiseUsed!==G.night&&Math.random()<.3){botAct(b,"disguise",{clan:pick(Object.keys(CLANS).filter(c=>c!=="tzi"))})}
    if(!b.target||b.target===b.pos||Math.random()<.15)b.target=botTarget(b);botMove(b,b.target)}
  for(const b of bots())if(b.alive&&b.alarm>=CONFIG.alarmMax){b.alive=false;addLog(`<b>Маскарад.</b> Клан ${CLANS[b.clan].name} слишком часто попадался людям на глаза. Князь казнил его Сородича.`)}
}
function botDusk(b){b.searched={};b.disguise=null;b.busy=0;b.wantE=false;b.pos=b.haven;b.hunger=clamp(b.hunger+1,0,CONFIG.hungerMax);b.alarm=Math.max(0,b.alarm-1);b.attend=Math.random()<.85;b.target=null;b.enc=null;
  // перебежчик: маленькая сторона зовёт к себе
  if(!b.switched&&G.night>=5&&Math.random()<.08){const mine=countOwn(b.fac),other=countOwn(b.fac==="cam"?"ana":"cam");if(other<mine-4&&!b.exposed){b.fac=b.fac==="cam"?"ana":"cam";b.switched=true}}}
