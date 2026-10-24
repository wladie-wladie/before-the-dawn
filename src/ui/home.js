
/* ============================ ГЛАВНОЕ МЕНЮ ============================
   Открывается при запуске и из меню в верхней строке. Продолжить — если партия идёт,
   Новая игра, Настройки (звук, вид карты), Как играть, Об игре. */
function homeOpen(view="main"){UI.home=view;closeMenu();render()}
function homeClose(){UI.home=null;render()}
function hasGame(){return !!(G&&me()&&me().clan&&G.phase!=="end")}
function homeNew(){if(hasGame()&&UI.home!=="confirm"){UI.home="confirm";return render()}UI.home=null;newCity()}
function homeSettings(){const m=typeof sndMode!=="undefined"?sndMode:"off";const v=$("#vol")?$("#vol").value:.5;
  return `<div class="hm-set"><span class="eyebrow">Звук</span><div class="seg">${[["off","Выкл"],["noir","Нуар"],["amb","Эмбиент"]].map(([k,l])=>`<button class="${m===k?"on":""}" onclick="setSound('${k}');document.querySelectorAll('#snd button').forEach(b=>b.classList.toggle('on',b.dataset.m==='${k}'));render()">${l}</button>`).join("")}</div>
   <label class="menu-row hint">Громкость <input type="range" min="0" max="1" step="0.05" value="${v}" aria-label="Громкость" oninput="const r=$('#vol');r.value=this.value;r.oninput&&r.oninput()"></label>
   <span class="eyebrow">Карта</span><div class="seg">${MAP3D.ok?[["3d","Объёмная 3D"],["2d","Плоская 2D"]].map(([k,l])=>`<button class="${(MAP3D.on?"3d":"2d")===k?"on":""}" onclick="MAP3D.setOn(${k==="3d"});render()">${l}</button>`).join(""):'<span class="hint">Только 2D: браузер не поддерживает 3D.</span>'}</div>
   <p class="hint">Свой музыкальный трек можно включить в меню ≡ в верхней строке.</p></div>`}
function homeHow(){return `<ul class="how"><li><b>Осматривайтесь.</b> В каждом районе — свои события. Удачный выбор даёт находку: контакт, предмет или место.</li>
  <li><b>Каждую вторую ночь Князь собирает двор</b> и требует объяснить происшествие. Кто выше Статусом, кладёт свою находку в дело первым.</li>
  <li><b>Пустые ячейки займут слухи.</b> Слух можно пустить и самому — в баре, клубе, на рынке, вокзале.</li>
  <li><b>Тайно работайте на свою сторону:</b> «Влияние» сдвигает район к Камарилье или к анархам. Видно, чей район, но не кто вложился.</li>
  <li><b>Броски.</b> Простые: 2–3 шестигранника, любая 5–6 — удача. Как в V5: атрибут + навык на десятигранниках, успех — 6+, нужно 2 успеха; кубы Голода опасны.</li>
  <li><b>Карта:</b> левая кнопка мыши — сдвиг, правая — поворот и наклон, колесо — масштаб, <b>пробел</b> — вернуться к персонажу в исходном ракурсе.</li>
  <li><b>До 06:00 вернитесь в убежище</b> — рассвет на улице почти всегда смертелен.</li></ul>`}
function homeAbout(){return `<p>Неофициальная фан-игра по Vampire: The Masquerade. Город, кланы и дела Князя собираются заново в каждой партии.</p>${legalBadge()}<p class="hint">${EDITION==="unbound"?"Developed and published under license from Paradox Interactive.":"Неофициальный фан-проект. Не является официальным материалом World of Darkness и не одобрен Paradox Interactive. Распространяется бесплатно."} ${NOTICE}</p><p class="hint">v1.6</p>`}
function homeHtml(){if(!UI.home)return "";const v=UI.home;const m=hasGame()?me():null;
  const panel={settings:["Настройки",homeSettings()],how:["Как играть",homeHow()],about:["Об игре",homeAbout()],
    confirm:["Начать заново?",`<p>Текущая партия${m?` (${CLANS[m.clan].name}, ночь ${G.night} из ${CONFIG.nights})`:""} будет потеряна.</p><div class="row"><button class="go red" onclick="homeNew()"><span>Да, новая игра</span>${ico("arrow")}</button><button class="ghost" onclick="UI.home='main';render()">Отмена</button></div>`]}[v];
  const item=(label,sub,on,cls="")=>`<button class="hm-b${cls}" onclick="${on}"><span><b>${label}</b>${sub?`<i>${sub}</i>`:""}</span>${ico("arrow")}</button>`;
  return `<div class="hm-bg"></div><div class="hm-in">
   <div class="hm-brand"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M20.5 4.5a11.5 11.5 0 1 0 7 19.8A10 10 0 0 1 20.5 4.5z"/></svg><h1>Before the Dawn</h1><p>Двенадцать ночей. Один город. Князь ждёт ответов.</p></div>
   <nav class="hm-nav" aria-label="Главное меню">
    ${m?item("Продолжить",`${CLANS[m.clan].name} · ночь ${G.night} из ${CONFIG.nights}`,"homeClose()"," pri"):""}
    ${item("Новая игра",m?"Новый город и новый персонаж":"Создать персонажа","homeNew()",m?"":" pri")}
    ${item("Настройки","Звук и вид карты","UI.home='settings';render()")}
    ${item("Как играть","","UI.home='how';render()")}
    ${item("Об игре","","UI.home='about';render()")}
   </nav>
   ${panel?`<section class="hm-panel pn${v==="confirm"?" red":""}"><div class="pn-in"><div class="hm-ph"><h2>${panel[0]}</h2><button class="ib" aria-label="Закрыть" onclick="UI.home='main';render()">${ico("x")}</button></div>${panel[1]}</div></section>`:""}
  </div>`}
