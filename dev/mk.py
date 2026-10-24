# Сборка одной страницы из модулей: python3 mk.py
import os
d=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
CSS=['base','map','setup','court','overlays','scene']
JS=['data/data','data/cases','data/events',            # данные
    'core/cityart','core/city','core/state','core/rules','core/v5','core/time','core/commands','core/bots',  # движок
    'ui/map','ui/map3d','ui/audio','ui/side','ui/scene','ui/home','ui/setup','ui/court','ui/overlays','ui/app']                    # экраны
r=lambda p:open(d+'src/'+p).read()
css='\n'.join(r(f'css/{c}.css') for c in CSS)
head=r('shell-head.html')+'<style>\n'+css+'\n</style>\n'+r('shell-body.html')
js='\n'.join(f'/* ===== {f}.js ===== */\n'+r(f+'.js') for f in JS)
os.makedirs(d+'dev/out',exist_ok=True);open(d+'dev/out/head.html','w').write(head);open(d+'dev/out/game.js','w').write(js)
open(d+'dev/out/page.html','w').write(head+'<script>\n'+js+'\n</script>\n')
print('ok',len(head)+len(js))
