
/* ============================ СОСТОЯНИЕ ПАРТИИ ============================
   G — мир (город, районы, дело Князя, слухи, время) и G.P — все участники.
   Человек и боты хранятся одинаково; различает их только поле control.
   Здесь нет ничего про экран: интерфейс хранит своё в UI (см. ui/app.js). */
const ME="me"; // участник, от лица которого смотрит этот экран
let UID=1;const uid=()=>"x"+(UID++);
const me=()=>G&&G.P?G.P.find(p=>p.id===ME):null;
const myPos=()=>{const m=me();return m&&m.pos||null};
const bots=()=>G.P.filter(p=>p.control==="bot");
const actors=()=>G.P.filter(a=>a.alive);
const actorById=id=>G.P.find(p=>p.id===id);
const actorOfClan=c=>actors().find(a=>a.clan===c);
const isMe=a=>a&&a.id===ME;
const who=a=>isMe(a)?"вы":`клан ${CLANS[a.clan].name}`;
const Who=a=>isMe(a)?"Вы":`Клан ${CLANS[a.clan].name}`;
const vb=(a,mine,theirs)=>isMe(a)?mine:theirs; // глагол от лица смотрящего: «кладёте» / «кладёт»

function newWorld(seed,city){
  return {seed,city,phase:"gen",night:1,time:CONFIG.nightStart,P:[],log:[],ev:[],evN:0,
    rumors:[],traces:[],casesDone:[],case:null,heat:0,sheriff:null,gathered:0,court:null,setup:{}}}
// общий каркас участника: всё, что есть и у человека, и у бота
function mkPlayer(id,control,clan,haven){
  return {id,control,clan,fac:null,alive:true,pos:haven,haven,status:3,money:3,hunger:1,alarm:0,hand:[],
    contrib:{cam:0,ana:0},placed:0,usedEv:[],searched:{},disguise:null,switched:false,exposed:false,
    seen:new Set(),visited:new Set(),visitedTonight:new Set(),enc:null,warn1:0,warn2:0}}

/* ---------- сохранение: Set → массив, город пересобирается по зерну ---------- */
const SAVE_KEY="before-the-dawn-v2";
function serialize(){return JSON.stringify({...G,city:{seed:G.seed},UID},(k,v)=>v instanceof Set?{__set:[...v]}:v)}
function deserialize(t){const o=JSON.parse(t,(k,v)=>v&&typeof v==="object"&&Array.isArray(v.__set)?new Set(v.__set):v);
  const city=generate(o.seed);rng=Math.random;UID=o.UID||9999;delete o.UID;o.city=city;return o}
