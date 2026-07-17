# PUBLISH.md — 공개 게시 규칙 (vault → site)

이 repo는 **공개 산출물**이다. 원본(source of truth)은 비공개 `~/github/knowledge-vault/portfolio/`
(+ resume: `knowledge-vault/job-applications/resume/`). 콘텐츠 수정은 vault에서 하고,
사이트에는 아래 규칙을 통과한 sanitized 영문 요약만 반영한다.

## 소스 매핑
| 사이트 섹션 | vault 원본 |
|---|---|
| Hero / About / Experience / Education | `job-applications/resume/Jaeuk_Moon_Resume_*.docx` (최신본) |
| Research & Publications | `portfolio/PhD Research/*.md` + CV(`JW_CV 졸업.docx`) 서지 |
| Projects | `portfolio/Applied Projects/*.md` |

## 프라이버시·기밀 게이트 (배포 전 필수, 전부 0건이어야 함)
```bash
for pat in "6577" "8460" "pqsolution" "1995" "Achasan" "Anam-ro" "3290" "3256" "ehwang04" \
           "Samsung DS" "LloydK" "lloydk" "Galaxy Watch" "birth"; do
  c=$(grep -ri "$pat" . --include="*.html" --include="*.css" --include="*.js" | wc -l | tr -d ' ')
  [ "$c" != "0" ] && echo "HIT($c): $pat"
done
```
- 금지: 전화·생년월일·집주소·개인 이메일·지도교수 연락처, 고객사/납품경로 실명, 미발표 제품·프로젝트명, 심사상태 상세(리비전 단계 등은 "under review"로; MIFlu는 2026-07 억셉 확정되어 "accepted" 표기)
- 허용 이메일: `jaewookmo@gmail.com` 만 (구 `pqsolutionax@gmail.com`은 2026-07-17부로 사용 중단 — 스캔 패턴에 포함)
- 비공개 repo로의 링크 금지 (공개 전환 전까지 카드에서 링크 제거 상태 유지)

## 갱신 절차
1. vault `portfolio/` 문서 수정 (국문 상세는 vault에만)
2. Claude에 "포트폴리오 사이트 갱신" 요청 → vault 원본과 사이트 diff → 규칙 적용해 반영
3. 위 게이트 스캔 0건 확인 → commit → push (Pages 자동 배포)

## 보류 중 (사용자 자산 필요)
- [~] 프로필 사진 — v4 프레임+슬롯 구현됨(2026-07-05), 현재 JM 모노그램 placeholder.
      실사진 받으면 `assets/profile.jpg`로 넣고 index.html의 src만 교체
- [x] 공개용 sanitized resume PDF — `assets/resume.pdf` + 네비 Resume 버튼.
      2026-07-17부터 사용자 지정본(`취업/Jaeuk_Moon_Resume_260607.docx`)을 Word COM으로 헤더 PII(집주소·전화)만
      제거 후 PDF 변환해 게시 (이메일 jaewookmo@gmail.com 유지, 본문은 지정본 그대로 — 사용자 승인 2026-07-17)
- [x] Research 대표 그림 4종 — RESEAT 히트맵·CTGAN PCA·MARAPAS 예측(repo 산출물) + CMC Fig.1
      프레임워크(Tech Science OA, CC-BY). featured 카드 4개
- [x] **MAVAE 그림** — Elsevier CDN(`ars.els-cdn.com/.../1-s2.0-S2352710223002784-gr1_lrg.jpg`)에서
      Fig.1 확보(저자 본인 그림 재사용), featured 5번째 카드 (2026-07-05). ※Elsevier 그림은 PII 기반
      `ars.els-cdn.com/content/image/1-s2.0-<PII>-gr<N>_lrg.jpg`로 페이월 없이 접근 가능
- [ ] **MIFlu 그림** — 이 머신에 원본 자체가 없음(전수 검색). 다른 기기의 Fig.1(2-LLM 구조도) 파일 또는 게재 PDF 필요
- 참고: 논문 전문 아카이브 = knowledge-vault `papers/` (full 3: ctgan·cmc·applsci / abstract-only 5).
      사이트 서지 검수는 여기 대조. MIFlu는 Crossref/PubMed 기준 게재 완료(JBHI vol.29 no.10, pp.7790–7801, 2025)
- [x] 논문 DOI 링크 — 8편 전부 Crossref 검증 후 제목에 연결 (2026-07-05)
- [x] 비공개 repo 3개(explainable-ILI-Forecasting, csat-eval, Slime-NeMo-gym) — **비공개 유지 확정**
      (사용자 결정 2026-07-05). 카드 링크 제거 상태 유지; 공개 전환 시에만 링크 복원
- [x] 박사논문 공식 제목 — **"An AI-based Influenza-like Illness Occurrence Forecasting Scheme based on LLM"**
      으로 통일 (사용자 확정 2026-07-17; resume 원본 docx + 사이트 Education 반영)
- [ ] 삼성 재직 프로젝트 카드 5종(csat-eval · slime+NeMo Gym · Health LLM Eval Harness ·
      Korean Term Extraction · On-Prem LLM Routing) — 2026-07-17 사이트에서 **일괄 제거**(사용자 지시:
      상세 노출 위험). 재게재는 항목별 사용자 승인 + 간략화 버전으로만
