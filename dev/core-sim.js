// прогон движка без интерфейса: человек ходит случайными командами из options(), боты — сами
const fs=require('fs');const files=['data/data','data/cases','data/events','core/cityart','core/city','core/state','core/rules','core/time','core/commands','core/bots'];
const code=files.map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n')+'\n;this.API={get G(){return G},set G(v){G=v},newWorld,generate,dispatch,options,cardsFor,can,me,bots,freeCells,CONFIG,leader,tplOf};';
const ctx={console,Math,JSON,Set,Object,Array,String,Number,setTimeout};require('vm').createContext(ctx);require('vm').runInContext(code,ctx);
const A=ctx.API;let errs=[],res=[];
for(let g=0;g<Number(process.argv[2]||8);g++){try{
  A.G=A.newWorld(g+1,A.generate(g+1));A.G.phase='setup';
  const clans=['tor','ven','nos','bru','tre','gan','tzi'];
  let r=A.dispatch('me','start',{clan:clans[g%7],fac:g%2?'ana':'cam',death:g%3?'final':'respawn'});if(!r.ok)throw Error('start '+r.reason);
  let steps=0;
  while(A.G.phase!=='end'&&steps++<6000){const G=A.G,M=A.me();
    if(G.phase==='day'){A.dispatch('me','nextNight');continue}
    if(G.phase==='court'){const Ct=G.court;
      if(Ct.phase==='intro'){A.dispatch('me','courtListen');continue}
      if(Ct.phase==='turns'){let done=false;for(const cell of A.freeCells()){const cs=A.cardsFor(M,'place',{cell:cell.id});if(cs.length&&Math.random()<.7){r=A.dispatch('me','place',{cell:cell.id,card:cs[0].id});if(!r.ok)throw Error('place '+r.reason);done=true;break}}if(!done)A.dispatch('me','pass');continue}
      if(Ct.phase==='sheriff'){A.dispatch('me','courtSkip');continue}
      if(Ct.phase==='result'){A.dispatch('me','courtLeave');continue}}
    if(M.enc){if(M.enc.res)A.dispatch('me','close');else{const ok=M.enc.e.c.map((c,i)=>i).filter(i=>!M.enc.e.c[i].dis);r=A.dispatch('me','choose',{i:ok[Math.floor(Math.random()*ok.length)]});if(!r.ok)throw Error('choose '+r.reason)}continue}
    if(M.tradeWith){const cs=A.cardsFor(M,'trade');A.dispatch('me','trade',cs.length?{card:cs[0].id}:{cancel:true});continue}
    // домой, если пора
    const opts=A.options('me');const home=opts.find(o=>o.cmd==='goHome');
    const left=A.CONFIG.nightEnd-G.time;
    const pathHome=()=>{const bfs=ctx.bfs;return bfs(M.pos,M.haven,null)};
    if(home&&home.primary){const p=pathHome();r=A.dispatch('me','move',{to:p[0],rush:true});continue}
    if(G.night%2===0&&G.gathered!==G.night&&G.time>=A.CONFIG.gFrom-6&&G.time<A.CONFIG.gTo&&M.pos!=='0,0'){const p=ctx.bfs(M.pos,'0,0',null);r=A.dispatch('me','move',{to:p[0]});continue}
    const pick=opts.filter(o=>!o.ui&&!o.reason&&o.cmd!=='sleep'&&o.cmd!=='switchSide');
    if(Math.random()<.45){const ns=ctx.nbrs(M.pos);r=A.dispatch('me','move',{to:ns[Math.floor(Math.random()*ns.length)]});continue}
    const o=pick[Math.floor(Math.random()*pick.length)];if(!o){A.dispatch('me','wait');continue}
    let args=o.args||{};if(o.need==='card'){const cs=A.cardsFor(M,o.cmd);args={card:cs[0].id}}if(o.need==='clan')args={clan:'ven'};if(o.need==='hex')args={k:M.pos};if(o.need==='pay')args={pay:'status'};
    r=A.dispatch('me',o.cmd,args);if(!r.ok)throw Error(o.cmd+' '+r.reason)}
  if(process.env.LOG&&g==Number(process.env.LOG))console.log(A.G.log.slice(0,8).map(l=>l.time+" "+l.t).join("\n"));const G=A.G;res.push([G.phase,G.result,G.night,steps,G.casesDone.length,A.bots().map(b=>b.clan+(b.alive?'':'†')+b.status).join(' '),A.me().status,A.me().hand.length].join(' '))
}catch(e){errs.push('game '+g+': '+e.stack.split('\n').slice(0,3).join(' | '))}}
console.log(res.join('\n'));console.log(errs.length?errs:'no errors');
