"""apple/index.html·style.css에 실제로 쓰인 글자만 남겨 Pretendard 서브셋 폰트를 다시 만든다.

문구를 고치거나 새 글자가 들어가면 반드시 다시 실행할 것. (안 하면 새 글자만 다른 폰트로 보인다)

준비:  pip install fonttools brotli
원본:  PretendardVariable.ttf
       - https://github.com/orioncactus/pretendard 릴리스, 또는
       - npm pack pretendard 후 package/dist/public/variable/PretendardVariable.ttf
실행:  python3 tools/subset_font.py <PretendardVariable.ttf 경로>
"""
import sys, pathlib
from fontTools import subset

root = pathlib.Path(__file__).resolve().parent.parent
src = [root / 'apple' / 'index.html', root / 'apple' / 'assets' / 'style.css']
chars = set()
for p in src:
    chars |= set(p.read_text(encoding='utf-8'))
chars |= {chr(c) for c in range(32, 127)}
chars |= set('—–·‘’“”…→↗‹›×÷−')
text = ''.join(sorted(c for c in chars if c.isprintable()))
tmp = root / 'tools' / '.chars.txt'
tmp.write_text(text, encoding='utf-8')
out = root / 'apple' / 'assets' / 'fonts' / 'pretendard-sub.woff2'
subset.main([sys.argv[1], f'--text-file={tmp}', '--flavor=woff2', '--layout-features=*', f'--output-file={out}'])
tmp.unlink()
print(f'ok · {len(text)} chars → {out} ({out.stat().st_size:,} bytes)')
