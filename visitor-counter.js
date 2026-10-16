/* Shared public-site visitor counter. Counts begin on 2026-10-16. */
(() => {
  'use strict';
  const script = document.currentScript;
  const site = script && script.dataset.site;
  const sites = ['portfolio', 'kr-job-radar', 'TSF', 'wm-survey-site',
    'opic-site', 'saju-site', 'cockpit', 'wedding-pick'];
  if (!sites.includes(site) || document.querySelector('[data-site-visitors]')) return;

  const english = document.documentElement.lang.startsWith('en');
  const label = english ? 'Total visitors' : '누적 방문자';
  const since = english ? 'Since Oct 16, 2026' : '2026.10.16부터 집계';
  const explanation = english
    ? 'Estimated unique browsers, not page views. Repeat visits share an anonymous browser identity; another browser or cleared storage may count again. Counting starts on Oct 16, 2026. Aggregate statistics: Busuanzi.'
    : '페이지 조회 수와 구분한 브라우저 기준 추정 방문자 수입니다. 같은 브라우저의 재방문은 익명 식별자로 중복을 줄이며, 다른 브라우저나 저장소 초기화 시 다시 집계될 수 있습니다. 2026년 10월 16일부터 집계합니다. 집계 서비스: Busuanzi.';
  let anchors = site === 'portfolio'
    ? [document.querySelector('.intro__tagline')]
    : site === 'wedding-pick'
      ? [...document.querySelectorAll('#gate h1, header h1')]
      : [document.querySelector('h1')];
  anchors = anchors.filter(Boolean);
  // Some older public pages have no heading.
  if (!anchors.length) anchors = [document.body];
  const values = [];
  anchors.forEach(anchor => {
    const host = document.createElement('div');
    host.dataset.siteVisitors = site;
    host.style.cssText = 'display:block;width:fit-content;max-width:min(100%,calc(100vw - 32px));margin:10px 0 14px;';
    const shadow = host.attachShadow({mode: 'open'});
    shadow.innerHTML = `<style>
      :host{font:12px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:inherit}
      details{position:relative;width:fit-content;max-width:100%}
      summary{display:flex;align-items:center;flex-wrap:wrap;gap:7px;box-sizing:border-box;
        max-width:100%;padding:7px 12px;border:1px solid color-mix(in srgb,currentColor 20%,transparent);
        border-radius:12px;background:color-mix(in srgb,currentColor 4%,transparent);
        list-style:none;cursor:pointer;letter-spacing:0;text-transform:none}
      summary::-webkit-details-marker{display:none}
      summary:focus-visible{outline:2px solid currentColor;outline-offset:3px}
      svg{width:15px;height:15px;flex:none;opacity:.65}
      .label{opacity:.78} strong{font-size:14px;font-weight:750;font-variant-numeric:tabular-nums}
      .since{font-size:10px;opacity:.65;border-left:1px solid currentColor;padding-left:8px;margin-left:2px}
      .info{opacity:.55;font-size:11px}
      p{max-width:360px;margin:9px 0 0;font-size:11px;line-height:1.65;opacity:.8}
      @media(max-width:420px){summary{gap:6px;padding:6px 10px}.since{font-size:9px}}
    </style><details><summary aria-label="${label}: ${english ? 'loading' : '불러오는 중'}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5.2"/></svg>
      <span class="label">${label}</span><strong aria-live="polite">…</strong>
      <span class="since">${since}</span><span class="info" aria-hidden="true">ⓘ</span>
    </summary><p>${explanation}</p></details>`;
    if (anchor === document.body) anchor.prepend(host);
    else anchor.after(host);
    values.push({value: shadow.querySelector('strong'), summary: shadow.querySelector('summary')});
  });

  const api = 'https://busuanzi.9420.ltd/api';
  // One aggregate key per site: subpages, query strings, form values and private
  // dashboard contents are never sent to the counter service.
  const reference = `https://jaeukmoon.github.io/visitor-counts/${site}/`;
  const headers = {'x-bsz-referer': reference};
  try {
    const identity = localStorage.getItem('site-visitor-identity');
    if (identity) headers.Authorization = `Bearer ${identity}`;
  } catch (_) { /* Counting also works when browser storage is unavailable. */ }
  const production = location.origin === 'https://jaeukmoon.github.io';
  const automated = navigator.webdriver || /HeadlessChrome\//.test(navigator.userAgent);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  fetch(api, {
    method: production && !automated ? 'POST' : 'GET',
    headers, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store',
    signal: controller.signal
  }).then(async response => {
    if (!response.ok) throw new Error('Counter unavailable');
    const result = await response.json();
    const count = result.data && result.data.page_uv;
    if (result.success !== true || !Number.isSafeInteger(count) || count < 0)
      throw new Error('Invalid counter response');
    const identity = response.headers.get('Set-Bsz-Identity');
    if (identity) {
      try { localStorage.setItem('site-visitor-identity', identity); } catch (_) {}
    }
    const formatted = new Intl.NumberFormat(english ? 'en-US' : 'ko-KR').format(count);
    values.forEach(({value, summary}) => {
      value.textContent = formatted + (english ? '' : '명');
      summary.setAttribute('aria-label', `${label}: ${value.textContent}. ${since}`);
    });
  }).catch(() => {
    values.forEach(({value, summary}) => {
      value.textContent = english ? 'Unavailable' : '집계 연결 중';
      summary.setAttribute('aria-label', `${label}: ${value.textContent}`);
    });
  }).finally(() => clearTimeout(timeout));
})();
