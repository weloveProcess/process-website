#!/usr/bin/env python3
"""홈페이지 index.html 을 작전판 중심 구성으로 바꾼다.

사용:  python3 apply.py <원래 index.html> <결과 index.html>

- <main> 안에서 «프로세스 레터» 블록(<div id="letter"> … </div>)은 그대로 둔다.
  이 블록은 매일 갱신 스크립트가 만드는 부분이다.
- 그 앞을 main-top.html, 그 뒤를 main-bottom.html 로 바꾼다.
- <head> 에 home-board.css 를, 본문 끝에 home-board.js 를 넣고 제목·설명 문구를 바꾼다.
- 헤더·푸터(shell)와 공유 미리보기(share) 구역은 건드리지 않는다.
- 이미 적용된 파일에 다시 돌려도 결과가 같다.
"""
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
VERSION = "20261110"
TITLE = "프로세스 | 축구 작전판 · 훈련 만들기 · 전술 설명"
DESC = ("작전판 하나로 훈련을 만들고 전술을 설명하세요. 그림과 훈련 방법, 코칭 포인트를 한 장에 담고 "
        "장면을 애니메이션으로 보여 주는 프로세스 스튜디오, 그리고 축구 교과서와 지식 허브.")
CSS = f'<link rel="stylesheet" href="/assets/home-board.css?v={VERSION}">'
JS = f'<script src="/assets/home-board.js?v={VERSION}" defer></script>'


def apply(html: str) -> str:
    top = (HERE / "main-top.html").read_text(encoding="utf-8").strip()
    bottom = (HERE / "main-bottom.html").read_text(encoding="utf-8").strip()

    m = re.search(r'(<main\b[^>]*>)(.*)(</main>)', html, re.S)
    if not m:
        raise SystemExit("<main> 을 찾지 못했습니다.")
    body = m.group(2)
    start = body.find('<div id="letter">')
    end = body.find('</script></div>', start)
    if start < 0 or end < 0:
        raise SystemExit('레터 블록(<div id="letter"> … </script></div>)을 찾지 못했습니다. 홈 구조가 바뀌었는지 확인하세요.')
    letter = body[start:end + len('</script></div>')]
    html = html[:m.start()] + m.group(1) + top + letter + bottom + m.group(3) + html[m.end():]

    html = re.sub(r'<title>.*?</title>', f'<title>{TITLE}</title>', html, count=1, flags=re.S)
    html = re.sub(r'<meta name="description" content="[^"]*">',
                  f'<meta name="description" content="{DESC}">', html, count=1)

    html = re.sub(r'<link rel="stylesheet" href="/assets/home-board\.css[^>]*>\n?', '', html)
    html = re.sub(r'<script src="/assets/home-board\.js[^>]*></script>\n?', '', html)
    if '<!--shell:css-->' not in html or '<!--shell:ft-->' not in html:
        raise SystemExit("shell 표식을 찾지 못했습니다.")
    html = html.replace('<!--shell:css-->', CSS + '\n<!--shell:css-->', 1)
    html = html.replace('<!--shell:ft-->', JS + '\n<!--shell:ft-->', 1)
    return html


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    src, dst = map(pathlib.Path, sys.argv[1:])
    dst.write_text(apply(src.read_text(encoding="utf-8")), encoding="utf-8")
    print(f"완료: {dst}")
