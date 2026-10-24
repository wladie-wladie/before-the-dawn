import os
sp=os.path.dirname(os.path.abspath(__file__))+'/out/'
import sys
ver=sys.argv[1]
h=open(sp+'head.html').read();j=open(sp+'game.js').read()
h=h.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','').replace('<title>Before the Dawn</title>\n','')
e=h.index('</style>')+len('</style>')
head='''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Before the Dawn</title>
<meta name="theme-color" content="#07080c">
<meta name="description" content="Before the Dawn — неофициальная фан-игра по Vampire: The Masquerade">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Before the Dawn">
'''
css=h[:e]
body=h[e:].replace('<button onclick="closeMenu();newCity()">Новый город</button>','<button onclick="closeMenu();newCity()">Новый город</button>\n    <button id="installBtn" hidden>Установить приложение</button>').replace('<footer class="hint">','<footer class="hint">')
pwa='''
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}
let deferredInstall=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;document.getElementById("installBtn").hidden=false});
document.getElementById("installBtn").onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice.catch(()=>{});deferredInstall=null;document.getElementById("installBtn").hidden=true};
'''
repo=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
open(repo+'index.html','w').write(head+css+'\n</head>\n<body>'+body+'<script>\n'+j+pwa+'</script>\n</body>\n</html>\n')
import re
sw=open(repo+'sw.js').read();sw=re.sub(r'const VERSION = "[^"]*";',f'const VERSION = "{ver}";',sw);open(repo+'sw.js','w').write(sw)
