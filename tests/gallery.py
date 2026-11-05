"""Gallery tests. Needs a preview build:  npm run build:preview && node scripts/serve.mjs &  &&  python3 tests/gallery.py"""
import re, sys
from playwright.sync_api import sync_playwright
csp=re.search(r'Content-Security-Policy = "(.*?)"\n',open('netlify.toml').read()).group(1)
U='http://localhost:8080'; R=[]; bad=[]
def T(n,ok): R.append(('PASS' if ok else 'FAIL',n))
with sync_playwright() as p:
    b=p.chromium.launch()
    for w in (360,768,1280,1920):
        ctx=b.new_context(viewport={'width':w,'height':900}); pg=ctx.new_page(); errs=[]; failed=[]
        def h(route):
            if 'fonts.g' in route.request.url: return route.abort()
            r=route.fetch(); hd=dict(r.headers); hd['content-security-policy']=csp; route.fulfill(response=r,headers=hd)
        pg.route('**/*',h); pg.on('console',lambda m: errs.append(m.text[:100]) if m.type=='error' and 'fonts' not in m.text and 'ERR_FAILED' not in m.text else None)
        pg.on('response',lambda r: failed.append(r.url) if r.status>=400 and 'fonts' not in r.url else None)
        for u in ['/nexa-in-action/','/','/about/','/institutional-solutions/']:
            pg.goto(U+u); pg.wait_for_load_state('networkidle')
            if pg.evaluate('document.documentElement.scrollWidth')>w+1: bad.append((w,u,'overflow'))
        if errs or failed: bad.append((w,'console/http',(errs+failed)[:2]))
        ctx.close()
    ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page(); pg.route('**/fonts.g*',lambda r:r.abort())
    pg.goto(U+'/nexa-in-action/')
    T('gallery: 20 figures', pg.locator('.g-fig').count()==20)
    T('every image has alt, width, height, srcset; lazy loading', pg.evaluate("[...document.querySelectorAll('#gallery img')].every(i=>i.alt.length>20&&i.width>0&&i.height>0&&i.srcset.includes('480w')&&i.loading==='lazy')"))
    T('no generic/invented details in alts or captions (no dates, names, place words)', pg.evaluate("!/(20\\d\\d|college|university|giet|gnu|odisha|telangana|hyderabad|gunupur)/i.test([...document.querySelectorAll('#gallery img, #gallery figcaption')].map(e=>e.alt||e.textContent).join(' '))"))
    T('captions are the generic caption + single category tag', pg.evaluate("[...document.querySelectorAll('#gallery figcaption')].every(f=>f.textContent.replace(/\\s+/g,' ').trim()==='Classroom Sessions Classroom Training Session')"))
    pg.evaluate('window.scrollTo(0,document.body.scrollHeight)'); pg.wait_for_timeout(1500)
    for y in range(0,6000,700): pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(120)
    T('all gallery images actually load after scrolling', pg.evaluate("[...document.querySelectorAll('#gallery img')].every(i=>i.complete&&i.naturalWidth>0)"))
    first=pg.locator('.g-item').first; first.click(); pg.wait_for_timeout(250)
    T('lightbox opens with large image, caption, close button focused', pg.locator('#lb').is_visible() and pg.evaluate("document.getElementById('lb-img').naturalWidth>=900") and 'photo 1 of 20' in pg.inner_text('#lb-cap') and pg.evaluate("document.activeElement.classList.contains('lb-x')"))
    T('lightbox: body scroll locked', pg.evaluate("document.body.style.overflow==='hidden'"))
    pg.keyboard.press('ArrowRight'); T('ArrowRight -> photo 2', 'photo 2 of 20' in pg.inner_text('#lb-cap'))
    pg.keyboard.press('ArrowLeft'); pg.keyboard.press('ArrowLeft'); T('ArrowLeft wraps to photo 20', 'photo 20 of 20' in pg.inner_text('#lb-cap'))
    for _ in range(8): pg.keyboard.press('Tab')
    T('focus stays trapped inside the dialog', pg.evaluate("document.getElementById('lb').contains(document.activeElement)"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    T('Esc closes, focus returns to the opening thumbnail, scroll restored', pg.locator('#lb').is_hidden() and pg.evaluate("document.activeElement.classList.contains('g-item')&&document.activeElement.dataset.i==='0'") and pg.evaluate("document.body.style.overflow===''"))
    pg.locator('.g-item').nth(4).click(); pg.mouse.click(5,450); pg.wait_for_timeout(150); T('clicking the backdrop closes the viewer', pg.locator('#lb').is_hidden())
    pg.locator('.g-item').nth(2).focus(); pg.keyboard.press('Enter'); T('keyboard Enter on a thumbnail opens the viewer', pg.locator('#lb').is_visible()); pg.keyboard.press('Escape')
    # strips on other pages use different photos, all link to the gallery
    srcs={}
    for u,exp in [('/',6),('/institutional-solutions/',4),('/about/',3)]:
        pg.goto(U+u); pg.wait_for_load_state('networkidle'); n=pg.locator('.g-strip-item').count(); T(f'{u} shows {exp} gallery photos linking to /nexa-in-action/', n==exp and pg.locator('.g-strip-item').evaluate_all('e=>e.every(x=>x.getAttribute("href")=="/nexa-in-action/")'))
        srcs[u]=set(pg.locator('.g-strip-item img').evaluate_all('e=>e.map(x=>x.getAttribute("src"))'))
    T('no photo is repeated across home, institutional and about strips', len(srcs['/']|srcs['/institutional-solutions/']|srcs['/about/'])==13)
    pg.goto(U+'/'); T('footer links to NEXA in Action', pg.locator('footer a[href="/nexa-in-action/"]').count()==1)
    pg.goto(U+'/nexa-in-action/'); T('page has one h1 and canonical', pg.locator('h1').count()==1 and pg.locator('link[rel=canonical]').get_attribute('href').endswith('/nexa-in-action/'))
    # screenshots
    pg.set_viewport_size({'width':1440,'height':900}); pg.goto(U+'/nexa-in-action/'); pg.wait_for_timeout(1500); pg.screenshot(path='/tmp/shots/g_desktop.png')
    pg.locator('.g-item').nth(3).click(); pg.wait_for_timeout(500); pg.screenshot(path='/tmp/shots/g_lightbox.png'); pg.keyboard.press('Escape')
    pg.goto(U+'/'); pg.locator('.g-strip').scroll_into_view_if_needed(); pg.wait_for_timeout(1500); pg.screenshot(path='/tmp/shots/g_home.png')
    pg.set_viewport_size({'width':390,'height':844}); pg.goto(U+'/nexa-in-action/'); pg.wait_for_timeout(1500); pg.screenshot(path='/tmp/shots/g_mobile.png')
    pg.locator('.g-item').first.click(); pg.wait_for_timeout(500); pg.screenshot(path='/tmp/shots/g_lightbox_m.png')
    b.close()
print('LAYOUT/CSP/HTTP PROBLEMS:',bad or 'none')
for r in R: print(*r)
f=[r for r in R if r[0]=='FAIL']; print('\nTOTAL',len(R),'FAILED',len(f)); sys.exit(1 if (f or bad) else 0)
