# Public-site visitor count

`visitor-counter.js` is served from the portfolio root and included by the eight
active public sites. Each site uses a separate aggregate URL under
`https://jaeukmoon.github.io/visitor-counts/`; all of its subpages share that key.
The counter begins on October 16, 2026. No historical total is reconstructed.

The displayed number is Busuanzi `page_uv`, an approximate cumulative distinct
browser count, rather than page views. The service supplies an anonymous identity
which the browser stores and reuses. Different browsers, cleared storage and
shared network/browser configurations can affect the estimate. The provider
stores approximate distinct counts; it does not establish a count of people.

Requests contain only the fixed aggregate URL and the optional provider identity.
Cookies, page referrers, query strings, form data and decrypted content are not
sent. Normal production visits use POST. Local previews and recognized browser
automation use read-only GET, so verification does not inflate production totals.
An unavailable service or invalid response displays an unavailable state, not zero.

The public service is an external dependency without an uptime or retention
guarantee. Its official API and implementation are documented at
https://github.com/soxft/busuanzi/wiki/API and https://github.com/soxft/busuanzi.
The World Model source generator includes the script so daily regeneration keeps
the visitor display. The quant site's CSP allows only this service for counting.
