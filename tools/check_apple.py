"""apple/ 페이지를 데스크탑(1440)·모바일(390)로 끝까지 스크롤하며 점검한다.

준비:  pip install playwright && python3 -m playwright install chromium
실행:  (저장소 루트에서) python3 -m http.server 8000  을 켠 뒤
       python3 tools/check_apple.py http://localhost:8000/apple/
통과 기준: 모든 줄이 OK. 하나라도 FAIL이면 고친 뒤 다시 실행.
"""
import sys, os, asyncio
from playwright.async_api import async_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8000/apple/'

async def run(b, w, h):
    pg = await b.new_page(viewport={'width': w, 'height': h})
    errs, bad = [], []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('response', lambda r: bad.append(f'{r.status} {r.url}') if r.status >= 400 else None)
    await pg.goto(URL, wait_until='load')
    await pg.add_style_tag(content='html{scroll-behavior:auto!important}')
    H = await pg.evaluate('document.documentElement.scrollHeight')
    for y in range(0, H, 300):
        await pg.evaluate(f'scrollTo(0,{y})'); await pg.wait_for_timeout(40)
    await pg.wait_for_timeout(1500)
    total = await pg.evaluate('document.querySelectorAll(".win").length')
    r = {
        'no JS errors': not errs,
        'no 404s': not bad,
        f'battery shows {total}/{total}': (await pg.text_content('#battT')).strip().endswith(f'{total}/{total}'),
        'every case window opened': await pg.eval_on_selector_all('.win:not(.is-open)', 'e => e.length') == 0,
        'all spec rows shown': await pg.evaluate('[...document.querySelectorAll(".sp")].every(e => e.classList.contains("is-on"))'),
        'storyboards playing': await pg.evaluate('document.querySelector("#omt").classList.contains("is-play")'),
        'no horizontal scroll': not await pg.evaluate('document.documentElement.scrollWidth > innerWidth'),
        'all images loaded': await pg.evaluate('[...document.images].every(i => i.complete && i.naturalWidth > 0)'),
        'spec links point to real cases': await pg.evaluate('[...document.querySelectorAll(".spc")].every(a => document.querySelector(a.getAttribute("href")))'),
        'no 제페토 on page': '제페토' not in await pg.content(),
    }
    for k, v in r.items():
        print(f'  [{w}px] {"OK  " if v else "FAIL"} {k}')
    if errs: print('   JS errors:', errs[:3])
    if bad: print('   bad responses:', bad[:5])
    await pg.close()
    return all(r.values())

async def main():
    async with async_playwright() as p:
        exe = os.environ.get('CHROME')
        b = await p.chromium.launch(executable_path=exe, args=['--no-sandbox']) if exe else await p.chromium.launch()
        ok = [await run(b, 1440, 900), await run(b, 390, 844)]
        await b.close()
    print('ALL OK' if all(ok) else 'SOMETHING FAILED')
    sys.exit(0 if all(ok) else 1)

asyncio.run(main())
