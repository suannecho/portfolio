# 조수안 Portfolio (2022 - 2026)

보이는 문제가 아닌, 진짜 원인을 짚는 조수안입니다.

**Live:** https://suannecho.github.io/portfolio/

정적 HTML/CSS/JS로 만든 인터랙티브 포트폴리오입니다. 별도 빌드 없이 GitHub Pages로 배포됩니다.

## 구조

```
index.html            # 페이지 본문 (About · Project 01/02/03 · Contact)
assets/style.css      # 스타일 (다크 테마 + 민트/그린 포인트)
assets/main.js        # 인터랙션 (스크롤 리빌, 카운터, 필터, 라이트박스 등)
assets/img/           # 목업·아이콘 이미지 (WebP)
assets/portfolio.pdf  # 원본 PDF
.github/workflows/    # GitHub Pages 자동 배포
```

## 로컬에서 보기

```
python3 -m http.server 8000
# http://localhost:8000
```

## 수정하기

- 문구/내용: `index.html`
- 색상/레이아웃: `assets/style.css` 상단 `:root` 변수
- 이미지 교체: `assets/img/` 안의 파일을 같은 이름으로 덮어쓰기
