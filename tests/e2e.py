"""End-to-end tests (Playwright/Chromium). Run: node scripts/serve.mjs & python3 tests/e2e.py
Applies the production CSP from netlify.toml, mocks Netlify form submission, and never contacts the live site."""
import re, sys, urllib.parse
from playwright.sync_api import sync_playwright
csp=re.search(r'Content-Security-Policy = "(.*?)"\n',open('netlify.toml').read()).group(1)
U='http://localhost:8080'; R=[]; bad=[]
def T(n,ok): R.append(('PASS' if ok else 'FAIL',n))
def fillf(pg,k,vals):
    for n,v in vals.items():
        loc=pg.locator(f'#{k}-{n}'); (loc.select_option(label=v) if loc.evaluate('e=>e.tagName')=='SELECT' else loc.fill(v))
with sync_playwright() as p:
    b=p.chromium.launch()
    ext=[]
    for w in (360,768,1100,1180,1200,1240,1280,1366,1440,1920):
        ctx=b.new_context(viewport={'width':w,'height':900}); pg=ctx.new_page(); errs=[]
        def h(route):
            if 'fonts.g' in route.request.url: return route.abort()
            r=route.fetch(); hd=dict(r.headers); hd['content-security-policy']=csp; route.fulfill(response=r,headers=hd)
        pg.route('**/*',h); pg.on('request',lambda r: ext.append(r.url) if not r.url.startswith(U) and not r.url.startswith('data:') else None); pg.on('console',lambda m: errs.append(m.text[:100]) if m.type=='error' and 'fonts' not in m.text and 'ERR_FAILED' not in m.text else None)
        for u in ['/','/about/','/contact/','/institutional-solutions/','/courses/','/courses/python-programming/','/syllabus/','/resources/','/projects/']:
            pg.goto(U+u); pg.wait_for_load_state('networkidle')
            if pg.evaluate('document.documentElement.scrollWidth')>w+1: bad.append((w,u,'overflow'))
        pg.goto(U+'/'); vis=pg.locator('.n-links').is_visible()
        if w>=1200: T(f'{w}px: full nav visible, CTA on one line, nav not overflowing', vis and pg.locator('.n-cta').bounding_box()['height']<44 and pg.evaluate('(()=>{const n=document.querySelector("nav.top");return n.scrollWidth<=n.clientWidth+1})()'))
        else: T(f'{w}px: hamburger instead of nav', (not vis) and pg.locator('#ham').is_visible())
        if errs: bad.append((w,'console',errs[:2]))
        ctx.close()
    T('no third-party requests on any tested page (fonts are self-hosted)', not ext)
    ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    pg.goto(U+'/'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(400)
    fam={f['family'].strip('"') for f in pg.evaluate("[...document.fonts].filter(f=>f.status==='loaded').map(f=>({family:f.family}))")}
    T('real fonts load from our own server (Inter, Manrope, Space Grotesk)', {'Inter','Manrope','Space Grotesk'}<=fam)
    pg.goto(U+'/contact/')
    names=pg.evaluate('Array.from(document.forms).map(f=>[f.getAttribute(\"name\"),f.dataset.netlify,f.getAttribute("netlify-honeypot"),f.elements["form-name"].value])')
    T('5 forms: unique names, data-netlify, honeypot, hidden form-name matches', len(names)==5 and len({n[0] for n in names})==5 and all(n[1]=='true' and n[2]=='bot-field' and n[0]==n[3] for n in names))
    T('original form name nexa-enquiry preserved', 'nexa-enquiry' in [n[0] for n in names])
    T('all ids unique on contact page', pg.evaluate('(()=>{const ids=[...document.querySelectorAll("[id]")].map(e=>e.id);return ids.length===new Set(ids).size})()'))
    T('every visible field has a label', pg.evaluate("[...document.querySelectorAll('form.enq input, form.enq select, form.enq textarea')].filter(e=>e.type!=='hidden'&&e.tabIndex!==-1).every(e=>document.querySelector('label[for=\"'+e.id+'\"]'))"))
    sel=lambda: pg.evaluate('document.querySelector("[role=tab][aria-selected=true]").dataset.tab')
    for q,want in [('','course'),('?topic=institution-partnership','institution'),('?topic=internship-program','internship'),('?topic=workshop-bootcamp','workshop'),('?topic=website-development','software'),('?enquiry=institution','institution'),('?course=cybersecurity','course'),('?topic=syllabus-request','course'),('?topic=general','course'),('#workshop','workshop')]:
        pg.goto(U+'/contact/'+q); pg.reload(); T(f'deep link {q or "(none)"} -> {want} tab (1 panel visible)', sel()==want and pg.locator('.tabpanel:visible').count()==1)
    pg.goto(U+'/contact/?course=cybersecurity'); T('?course=cybersecurity preselects Cybersecurity', pg.input_value('#topic')=='Cybersecurity')
    pg.goto(U+'/contact/?topic=syllabus-request'); T('?topic=syllabus-request preselects syllabus option', 'Syllabus' in pg.input_value('#topic'))
    pg.goto(U+'/contact/'); pg.focus('#tab-course'); pg.keyboard.press('ArrowRight'); T('keyboard ArrowRight -> next tab', sel()=='institution')
    pg.keyboard.press('End'); T('keyboard End -> last tab', sel()=='software'); pg.keyboard.press('Home'); T('keyboard Home -> first tab', sel()=='course')
    for tab,fid in [('course','enquiry'),('institution','inst-form'),('internship','intern-form'),('workshop','ws-form'),('software','sw-form')]:
        pg.goto(U+'/contact/?enquiry='+tab); pg.click(f'#{fid} button[type=submit]')
        T(f'{tab}: empty submit flags >=3 invalid fields and shows message', pg.locator(f'#{fid} [aria-invalid=true]').count()>=3 and pg.locator(f'#{fid} .status.bad').is_visible())
    pg.goto(U+'/contact/?enquiry=institution'); pg.fill('#inst-name','A B'); pg.fill('#inst-email','not-an-email'); pg.fill('#inst-students','0'); pg.click('#inst-form button[type=submit]')
    T('institution: invalid email and zero students rejected', 'valid email' in pg.inner_text('#err-inst-email') and 'whole number' in pg.inner_text('#err-inst-students'))
    T('institution: phone required', 'phone number' in pg.inner_text('#err-inst-phone'))
    posts=[]
    def mock(route):
        rq=route.request
        if rq.method=='POST' and rq.url.rstrip('/')==U: posts.append(urllib.parse.parse_qs(rq.post_data,keep_blank_values=True)); return route.fulfill(status=200,body='ok')
        route.continue_()
    pg.route('**/*',mock)
    fill={'inst':{'name':'Test Person','institution':'Demo College','email':'t@example.com','phone':'9876543210','message':'We need a Python workshop for 2nd years.','institution_type':'College','interest':'Faculty development programme'},
          'intern':{'name':'Test Student','email':'s@example.com','message':'I know basic Python and want a project.','level':'Undergraduate','interest':'Programming Languages'},
          'ws':{'name':'Test Person','email':'t@example.com','phone':'9876543210','institution':'Demo School','message':'Intro to web development for class 10.','topic':'JavaScript'},
          'sw':{'name':'Test Owner','email':'o@example.com','message':'A simple website for a bakery with an order form.','project_type':'Business website'}}
    fm={'inst':'nexa-institution-enquiry','intern':'nexa-internship-enquiry','ws':'nexa-workshop-enquiry','sw':'nexa-software-enquiry'}
    tabof={'inst':'institution','intern':'internship','ws':'workshop','sw':'software'}
    for k,vals in fill.items():
        pg.goto(U+'/contact/?enquiry='+tabof[k]); fillf(pg,k,vals); pg.check(f'#{k}-consent'); n0=len(posts); pg.click(f'#{k}-form button[type=submit]'); pg.wait_for_timeout(500)
        ok=len(posts)==n0+1 and posts[-1].get('form-name')==[fm[k]] and posts[-1].get('consent')==['yes'] and posts[-1].get('bot-field')==[''] and all(posts[-1].get(n)==[v] for n,v in vals.items())
        T(f'{k}: valid submit posts form-name={fm[k]} with every field + consent', ok and pg.locator(f'#{k}-form .status.ok').is_visible() and pg.input_value(f'#{k}-name')=='')
    pg.goto(U+'/contact/?course=data-science'); pg.fill('#name','Test'); pg.fill('#email','x@example.com'); pg.fill('#message','Please share batch dates.'); pg.check('#consent'); n0=len(posts); pg.click('#enquiry button[type=submit]'); pg.wait_for_timeout(500)
    T('original course form posts form-name=nexa-enquiry with topic=Data Science', len(posts)==n0+1 and posts[-1]['form-name']==['nexa-enquiry'] and posts[-1]['topic']==['Data Science'])
    pg.goto(U+'/contact/?enquiry=workshop'); fillf(pg,'ws',fill['ws']); pg.evaluate('document.querySelector("#ws-form [name=bot-field]").value="spam"'); pg.check('#ws-consent'); n0=len(posts); pg.click('#ws-form button[type=submit]'); pg.wait_for_timeout(400)
    T('honeypot filled -> nothing sent', len(posts)==n0)
    pg.unroute('**/*',mock); pg.route('**/*',lambda r: r.fulfill(status=500,body='x') if r.request.method=='POST' else r.continue_())
    pg.goto(U+'/contact/?enquiry=software'); fillf(pg,'sw',fill['sw']); pg.check('#sw-consent'); pg.click('#sw-form button[type=submit]'); pg.wait_for_timeout(500)
    T('server error: shows "NOT sent", keeps data, re-enables button', 'NOT sent' in pg.inner_text('#sw-form .status') and pg.input_value('#sw-name')=='Test Owner' and pg.locator('#sw-form button[type=submit]').is_enabled())
    pg.unroute('**/*')
    pg.goto(U+'/contact/?enquiry=institution'); pg.evaluate("window.__o=[];window.open=function(u,t,f){window.__o.push([u,t,f]);return null}")
    pg.fill('#inst-name','Asha'); pg.fill('#inst-message','Need training for 60 students.'); pg.select_option('#inst-interest',label='Faculty development programme'); pg.click('#inst-form .wa-send')
    o=[x for x in pg.evaluate('window.__o') if x[0] and x[0].startswith('https://wa.me/')]; u=urllib.parse.unquote(o[0][0]) if o else ''
    T('WhatsApp fallback: wa.me link has name, enquiry type, interest, message; opens with noopener', bool(o) and 'https://wa.me/' in u and 'Asha' in u and 'Institution partnership enquiry' in u and 'Faculty development programme' in u and '60 students' in u and 'noopener' in (o[0][2] or ''))
    pg.set_viewport_size({'width':390,'height':844}); pg.goto(U+'/contact/?enquiry=institution'); pg.wait_for_timeout(900)
    T('mobile deep link scrolls the enquiry form into view', pg.evaluate('document.querySelector(".form-card").getBoundingClientRect().top')<300)
    pg.goto(U+'/contact/'); pg.wait_for_timeout(500); T('mobile plain /contact/ does not auto-scroll', pg.evaluate('window.scrollY')==0)
    pg.set_viewport_size({'width':1280,'height':900})
    pg.goto(U+'/institutional-solutions/'); T('institutional page: 8 offerings, 6 steps, 4 FAQs', pg.locator('.sec .card h3').count()>=8 and pg.locator('.step').count()==6 and pg.locator('details').count()==4)
    T('institutional page: Partner CTAs -> /contact/?enquiry=institution', pg.locator('a:has-text("Partner With NEXA")').evaluate_all('e=>e.length>0&&e.every(x=>x.getAttribute("href")=="/contact/?enquiry=institution")'))
    pg.goto(U+'/'); T('home: Partner With NEXA -> /institutional-solutions/', pg.locator('.hero .row a').nth(1).get_attribute('href')=='/institutional-solutions/')
    for name,w,u in [('m5_inst',1440,'/institutional-solutions/'),('m5_contact',1440,'/contact/?enquiry=institution'),('m5_contact_m',390,'/contact/?enquiry=institution')]:
        pg.set_viewport_size({'width':w,'height':900}); pg.goto(U+u); pg.wait_for_timeout(1300); pg.screenshot(path=f'/tmp/shots/{name}.png')
    b.close()
print('LAYOUT/CSP PROBLEMS:',bad or 'none')
for r in R: print(*r)
f=[r for r in R if r[0]=='FAIL']; print('\nTOTAL',len(R),'FAILED',len(f)); sys.exit(1 if (f or bad) else 0)
