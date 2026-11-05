"""Accessibility scan with axe-core (WCAG 2.1 A/AA). Run: node scripts/serve.mjs & python3 tests/a11y.py [--preview]"""
import json, sys, collections
from playwright.sync_api import sync_playwright
U='http://localhost:8080'
pages=['/','/about/','/courses/','/courses/python-programming/','/courses/cybersecurity/','/syllabus/','/syllabus/python-programming/','/syllabus/giet-btech-cse-r2019/','/institutions/','/institutional-solutions/','/resources/','/projects/','/contact/','/contact/?enquiry=institution','/contact/success/','/privacy/','/404.html']
if '--preview' in sys.argv: pages+=['/nexa-in-action/']
axe=open('node_modules/axe-core/axe.min.js').read(); agg=collections.defaultdict(lambda:{'impact':'','n':0,'pages':set(),'ex':[]})
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h in ((390,844),(1440,900)):
        ctx=b.new_context(viewport={'width':w,'height':h},bypass_csp=True); pg=ctx.new_page(); pg.route('**/fonts.g*',lambda r:r.abort())
        for u in pages:
            pg.goto(U+u); pg.wait_for_load_state('networkidle'); pg.evaluate('document.querySelectorAll(".reveal").forEach(e=>e.classList.add("vis"))'); pg.wait_for_timeout(700)
            if '/syllabus/' == u: pg.wait_for_selector('#lib:not([hidden])')
            pg.evaluate(axe); r=pg.evaluate("axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']}})")
            for v in r['violations']:
                a=agg[v['id']]; a['impact']=v['impact']; a['n']+=len(v['nodes']); a['pages'].add(u)
                if len(a['ex'])<2: a['ex'].append((u,w,v['nodes'][0]['target'][0][:60], v['nodes'][0].get('any',[{}])[0].get('message','')[:110] if v['nodes'][0].get('any') else v['help'][:100]))
        ctx.close()
    b.close()
order={'critical':0,'serious':1,'moderate':2,'minor':3}
for k,a in sorted(agg.items(),key=lambda kv:order.get(kv[1]['impact'],9)): print(f"{a['impact']:9} {k}: {a['n']} nodes on {len(a['pages'])} pages | e.g. {a['ex'][0]}")
ser=[k for k,a in agg.items() if a['impact'] in ('critical','serious')]
print('\nCRITICAL/SERIOUS RULES:',ser or 'none'); print('TOTAL RULES FAILING:',len(agg)); sys.exit(1 if ser else 0)
