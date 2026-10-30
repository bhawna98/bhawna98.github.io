#!/usr/bin/env python3
"""Functional checks for the terminal site. Run: python3 scripts/test.py (needs playwright + Chrome)."""
import functools,http.server,threading,pathlib,re
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",0),functools.partial(Q,directory=str(ROOT)))
threading.Thread(target=srv.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{srv.server_address[1]}/index.html"
fails=[]; passes=0
def check(name,cond,extra=""):
    global passes
    if cond: passes+=1
    else: fails.append(f"{name} {extra}")
FNS=["DES","GP","DEAL","HP","CN","ANR","HELP","MSG","CF"]
with sync_playwright() as pw:
    b=pw.chromium.launch(channel="chrome")
    for w,h in [(1440,900),(820,1000),(390,844)]:
        ctx=b.new_context(viewport=dict(width=w,height=h)); pg=ctx.new_page()
        errs=[]; pg.on("console",lambda m: errs.append(m.text) if m.type in("error","warning") else None); pg.on("pageerror",lambda e: errs.append(str(e)))
        bad=[]; pg.on("response",lambda r: bad.append(r.url) if r.status>=400 else None)
        pg.goto(base); pg.wait_for_timeout(1200)
        on=lambda: pg.eval_on_selector_all(".fn.on","els=>els.map(e=>e.id)")
        check(f"{w} boot DES",on()==["DES"],str(on()))
        check(f"{w} boot input cleared",pg.input_value("#cmd-in")=="")
        check(f"{w} title",pg.title().startswith("Bhawna Sharma | Private Markets"),pg.title())
        # every function via digits, check no hscroll and single section
        for i,f in enumerate(FNS):
            pg.keyboard.press(str(i+1)); pg.wait_for_timeout(120)
            check(f"{w} key {i+1}",on()==[f],str(on()))
            check(f"{w} aria-current {f}",pg.get_attribute(f'.fkeys a[href="#{f}"]',"aria-current")=="page")
            sw=pg.evaluate("document.documentElement.scrollWidth")
            check(f"{w} no hscroll {f}",sw<=w,str(sw))
            check(f"{w} scrolled top {f}",pg.evaluate("scrollY")==0,str(pg.evaluate("scrollY")))
        # command line
        for cmd,exp in [("deal","DEAL"),("cv","HP"),("BSHARMA SP Equity GP <GO>","GP"),("anr go","ANR"),("pdf","CF"),("hire","MSG"),("bsharma","DES"),("news","CN")]:
            pg.click("body",position=dict(x=5,y=h-5)) if False else None
            pg.fill("#cmd-in",cmd); pg.press("#cmd-in","Enter"); pg.wait_for_timeout(120)
            check(f"{w} cmd '{cmd}'",on()==[exp],str(on()))
        pg.fill("#cmd-in","hire"); pg.press("#cmd-in","Enter"); pg.wait_for_timeout(100)
        pg.fill("#cmd-in","xyz"); pg.press("#cmd-in","Enter"); pg.wait_for_timeout(100)
        check(f"{w} unknown err","err" in pg.get_attribute("#status","class") and "Unknown" in pg.inner_text("#status"))
        check(f"{w} unknown keeps view",on()==["MSG"],str(on()))
        # type from anywhere
        pg.evaluate("document.activeElement.blur()")
        pg.keyboard.type("hp"); pg.keyboard.press("Enter"); pg.wait_for_timeout(120)
        check(f"{w} global typing",on()==["HP"],str(on()))
        pg.keyboard.press("Escape"); pg.wait_for_timeout(120)
        check(f"{w} esc home",on()==["DES"],str(on()))
        pg.keyboard.press("/"); check(f"{w} slash focus",pg.evaluate("document.activeElement.id")=="cmd-in")
        # autocomplete
        pg.fill("#cmd-in","re"); pg.wait_for_timeout(80)
        opts=pg.eval_on_selector_all("#cmd-list li b","e=>e.map(x=>x.textContent)")
        check(f"{w} suggest visible",pg.is_visible("#cmd-list"))
        check(f"{w} suggest RE",set(opts)>={"ANR","HP"},str(opts))
        pg.press("#cmd-in","ArrowDown"); pg.press("#cmd-in","Enter"); pg.wait_for_timeout(120)
        check(f"{w} suggest pick",on()==[opts[0]],str(on()))
        check(f"{w} suggest closed",not pg.is_visible("#cmd-list"))
        pg.focus("#cmd-in"); pg.fill("#cmd-in",""); pg.press("#cmd-in","Escape"); pg.wait_for_timeout(100)
        check(f"{w} esc in empty input -> DES",on()==["DES"])
        # clicking suggestion
        pg.fill("#cmd-in","cov"); pg.wait_for_timeout(80); pg.click("#cmd-list li"); pg.wait_for_timeout(120)
        check(f"{w} click suggest",on()==["CN"],str(on()))
        # CN filters
        counts={}
        for k in ["all","tv","print","own"]:
            pg.click(f'.filters button[data-f="{k}"]')
            counts[k]=pg.eval_on_selector_all(".news li","e=>e.filter(x=>!x.hidden).length")
            label=int(re.search(r"\d+",pg.inner_text(f'.filters button[data-f="{k}"] span')).group())
            check(f"{w} filter count {k}",counts[k]==label,f"{counts[k]} vs {label}")
        pg.click('.filters button[data-f="all"]')
        # deep link
        pg.goto(base+"#deal-jp"); pg.wait_for_timeout(900)
        check(f"{w} deep DEAL",on()==["DEAL"],str(on()))
        check(f"{w} deep open",pg.evaluate("document.getElementById('deal-jp').open"))
        box=pg.evaluate("(()=>{const r=document.querySelector('#deal-jp summary').getBoundingClientRect();return [r.top,r.bottom,document.getElementById('chrome').offsetHeight,innerHeight]})()")
        check(f"{w} deep visible below header",box[0]>=box[2]-1 and box[1]<=box[3],str(box))
        # related links + internal anchors
        pg.goto(base); pg.wait_for_timeout(1000)
        hrefs=pg.eval_on_selector_all('a[href^="#"]',"e=>e.map(x=>x.getAttribute('href').slice(1))")
        missing=[x for x in set(hrefs) if not pg.query_selector(f'[id="{x}"]')]
        check(f"{w} anchors resolve",not missing,str(missing))
        pg.click('.heads a[href="#deal-rfp"]') if w>820 else pg.goto(base+"#deal-rfp")
        pg.wait_for_timeout(700)
        check(f"{w} headline -> open deal",on()==["DEAL"] and pg.evaluate("document.getElementById('deal-rfp').open"))
        # MSG
        pg.keyboard.press("Escape"); pg.keyboard.press("8"); pg.wait_for_timeout(100)
        pg.evaluate("window.__href=null")
        # images and fonts
        check(f"{w} headshot",pg.evaluate("document.querySelector('.card-id img').naturalWidth")>0)
        check(f"{w} fonts",pg.evaluate("document.fonts.check('12px \"Martian Mono\"') && document.fonts.check('15px \"Plex Cond\"')"))
        check(f"{w} clock",re.match(r"\d\d:\d\d SGT \d\d [A-Z]{3}$",pg.inner_text("#clock")) is not None,pg.inner_text("#clock"))
        check(f"{w} no console errors",not errs,str(errs))
        check(f"{w} no 4xx",not bad,str(bad))
        # tab order starts with skip link
        pg.goto(base); pg.wait_for_timeout(900); pg.keyboard.press("Tab")
        check(f"{w} skip link first",pg.evaluate("document.activeElement.className")=="skip")
        ctx.close()
    # no-JS fallback
    ctx=b.new_context(java_script_enabled=False,viewport=dict(width=1440,height=900)); pg=ctx.new_page(); pg.goto(base)
    vis=pg.eval_on_selector_all(".fn","e=>e.filter(x=>getComputedStyle(x).display!=='none').length")
    check("nojs all sections",vis==9,str(vis)); ctx.close()
    # reduced motion
    ctx=b.new_context(reduced_motion="reduce"); pg=ctx.new_page(); pg.goto(base); pg.wait_for_timeout(300)
    check("reduced: no tape anim",pg.evaluate("getComputedStyle(document.querySelector('.tape-track')).animationName")=="none")
    check("reduced: DES immediately",pg.evaluate("getComputedStyle(document.getElementById('DES')).opacity")=="1")
    ctx.close()
    # SEO basics
    ctx=b.new_context(); pg=ctx.new_page(); ga=[]
    pg.on("request",lambda r: ga.append(r.url) if "googletagmanager" in r.url or "google-analytics" in r.url else None)
    pg.goto(base); pg.wait_for_timeout(500)
    check("seo one h1",pg.eval_on_selector_all("h1","e=>e.length")==1)
    check("seo canonical",pg.get_attribute('link[rel=canonical]',"href")=="https://bhawna98.github.io/")
    check("seo jsonld parses",pg.evaluate("JSON.parse(document.querySelector('script[type=\"application/ld+json\"]').textContent)['@type']")=="ProfilePage")
    pg.keyboard.press("2"); pg.wait_for_timeout(150)
    check("title per function",pg.title()=="GP <GO> | Bhawna Sharma",pg.title())
    check("no analytics locally",not ga,str(ga[:2]))
    check("trackPage defined",pg.evaluate("typeof window.trackPage")=="function")
    ctx.close()
    # GP interaction
    for w,h in [(1440,900),(390,844)]:
        ctx=b.new_context(viewport=dict(width=w,height=h),has_touch=w<500); pg=ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
        pg.goto(base+"#GP"); pg.wait_for_timeout(400)
        check(f"gp {w} readout idle","Move across" in pg.inner_text("#gp-read") or w<820,pg.inner_text("#gp-read"))
        def at(x,y=208):
            box=pg.eval_on_selector("svg.gp","s=>{const m=s.getScreenCTM();return [m.a,m.d,m.e,m.f]}")
            pg.evaluate("([x,y])=>document.querySelector('.chart-wrap').scrollLeft=0",[x,y]) if False else None
            pg.mouse.move(box[0]*x+box[2],box[1]*y+box[3]); pg.wait_for_timeout(120)
        if w>=820:
            h0=pg.evaluate("document.getElementById('gp-read').offsetHeight")
            at(620,240)  # Edelman era, empty spot
            check("gp readout height stable",pg.evaluate("document.getElementById('gp-read').offsetHeight")==h0)
            r=pg.inner_text("#gp-read")
            check("gp crosshair date","2022" in r or "2023" in r,r)
            check("gp edelman active","Edelman" in r and "Client Executive" in r,r)
            check("gp klareco dimmed",pg.evaluate("!document.querySelector('[data-hp=hp-klareco]').classList.contains('hot')"))
            check("gp hovering class",pg.evaluate("document.querySelector('svg.gp').classList.contains('hovering')"))
            at(800,258)  # on Partners Group bar
            r=pg.inner_text("#gp-read")
            check("gp bar detail","Partners Group" in r and "Content Expert" in r and "HP" in r,r)
            check("gp bar alone hot",pg.eval_on_selector_all(".gp .item.hot","e=>e.length")==1)
            at(851,38)  # flag 5
            check("gp flag readout","63.65" in pg.inner_text("#gp-read"),pg.inner_text("#gp-read"))
            check("gp readout height stable w/ flag",pg.evaluate("document.getElementById('gp-read').offsetHeight")==h0)
            check("gp flag row hot",pg.evaluate("document.querySelector('.legend tr[data-flag=\"5\"]').classList.contains('hot')"))
            pg.mouse.move(5,5); pg.wait_for_timeout(120)
            check("gp clears",not pg.evaluate("document.querySelector('svg.gp').classList.contains('hovering')"))
            pg.hover('.legend tr[data-flag="2"]'); pg.wait_for_timeout(120)
            check("gp legend->flag",pg.evaluate("document.querySelector('.flag[data-flag=\"2\"]').classList.contains('hot')"))
            pg.click('[data-hp=hp-edelman]'); pg.wait_for_timeout(300)
            check("gp click opens HP",pg.evaluate("document.querySelector('.fn.on').id")=="HP" and pg.evaluate("document.getElementById('hp-edelman').open"))
            pg.goto(base+"#GP"); pg.wait_for_timeout(300)
            pg.focus('[data-hp=hp-ntu]'); pg.wait_for_timeout(120)
            check("gp keyboard focus readout","Nanyang" in pg.inner_text("#gp-read"),pg.inner_text("#gp-read"))
            pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
            check("gp keyboard enter opens HP",pg.evaluate("document.getElementById('hp-ntu').open") and pg.evaluate("document.querySelector('.fn.on').id")=="HP")
        else:
            pg.tap('[data-hp=hp-pg] rect'); pg.wait_for_timeout(300)
            check("gp tap opens HP",pg.evaluate("document.querySelector('.fn.on').id")=="HP")
            pg.goto(base+"#GP"); pg.wait_for_timeout(300)
            check(f"gp {w} no hscroll",pg.evaluate("document.documentElement.scrollWidth")<=w)
        check(f"gp {w} no errors",not errs,str(errs))
        ctx.close()
    # DES try keys, bio toggle, DEAL tiles
    for w,h in [(1440,900),(390,844)]:
        ctx=b.new_context(viewport=dict(width=w,height=h)); pg=ctx.new_page(); pg.goto(base); pg.wait_for_timeout(1300)
        check(f"{w} full bio collapsed",not pg.is_visible(".prose .more p"))
        pg.click(".prose .more summary"); check(f"{w} full bio opens",pg.is_visible(".prose .more p"))
        pg.click('[data-try="DEAL"]'); pg.wait_for_timeout(700)
        check(f"{w} try DEAL",pg.evaluate("document.querySelector('.fn.on').id")=="DEAL")
        check(f"{w} tiles 4",pg.eval_on_selector_all(".tiles a","e=>e.length")==4)
        check(f"{w} tiles no overflow",pg.evaluate("[...document.querySelectorAll('.tiles .tv')].every(e=>e.scrollWidth<=e.clientWidth+1)"))
        pg.click('.tiles a[href="#deal-rfp"]'); pg.wait_for_timeout(500)
        check(f"{w} tile opens case",pg.evaluate("document.getElementById('deal-rfp').open"))
        check(f"{w} no hscroll DEAL tiles",pg.evaluate("document.documentElement.scrollWidth")<=w)
        ctx.close()
    # contact form: Web3Forms is mocked, nothing is really sent
    ctx=b.new_context(); pg=ctx.new_page(); pg.goto(base+"#MSG"); pg.wait_for_timeout(400)
    sent=[]; reply={"ok":True}
    def api(r):
        sent.append((r.request.post_data_buffer or b"").decode("utf-8","replace"))
        r.fulfill(status=200 if reply["ok"] else 400,content_type="application/json",
                  body='{"success":true}' if reply["ok"] else '{"success":false,"message":"bad"}')
    pg.route("https://api.web3forms.com/**",api)
    pg.click("#compose button"); pg.wait_for_timeout(200)
    check("msg required blocks empty",not sent,str(len(sent)))
    pg.fill("#m-name","Alex Tan"); pg.fill("#m-from","alex@example.com"); pg.fill("#m-body","Hi Bhawna & team")
    pg.click("#compose button"); pg.wait_for_timeout(400)
    check("msg posted once",len(sent)==1,str(len(sent)))
    check("msg payload",bool(sent) and all(k in sent[0] for k in ["access_key","alex@example.com","Hi Bhawna & team"]),sent[0][:300] if sent else "")
    check("msg success status",pg.inner_text("#status").startswith("Message sent"),pg.inner_text("#status"))
    check("msg form reset",pg.input_value("#m-body")=="")
    check("msg stayed on page",pg.url.startswith(base))
    reply["ok"]=False
    pg.fill("#m-name","Alex Tan"); pg.fill("#m-from","alex@example.com"); pg.fill("#m-body","Second try")
    pg.click("#compose button"); pg.wait_for_timeout(400)
    check("msg error status","err" in pg.get_attribute("#status","class") and "Could not send" in pg.inner_text("#status"),pg.inner_text("#status"))
    check("msg error keeps text",pg.input_value("#m-body")=="Second try")
    check("msg button re-enabled",pg.is_enabled("#compose button"))
    ctx.close()
    b.close()
print(f"PASS {passes}  FAIL {len(fails)}"); print("\n".join(fails))
