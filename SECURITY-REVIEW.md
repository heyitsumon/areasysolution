# Security review

**Review date:** 2026-10-04  
**Status:** One confirmed finding; remediation implemented and tested.

## Finding

| # | Severity | Location | Vulnerability | Confidence | Status |
|---|---|---|---|---:|---|
| 1 | MEDIUM | `public/sw.js` (previously lines 54-60, 74-90) | The service worker previously cached every successful same-origin navigation and could replay a cached authenticated admin page offline after logout on a shared browser. | 9/10 | Fixed |

### Remediation

- Incremented the service-worker cache version so existing caches are removed on activation.
- Limited navigation interception to the public home, tools directory, and valid tool-page URL shapes without query strings.
- Required the server to explicitly mark eligible anonymous public HTML responses before the service worker can cache them.
- Left authenticated responses and protected routes out of the offline cache.
- Removed `Set-Cookie` and `Set-Cookie2` headers from responses stored for offline use.
- Added regression tests for private paths, query-string URLs, unmarked responses, `private`/`no-store` responses, and the server-side public cache marker.

## Verification

- Laravel test suite: 9 tests passed (75 assertions).
- JavaScript test suite: 9 tests passed.
- Vite production build: passed.
- Laravel Pint: passed.
- Live HTTP check: anonymous tool page opted in to public offline caching; `/admin` redirected to `/login`.

## Notes and limitations

This review identified a concrete issue; it does not certify that the application is completely secure. It is not a substitute for deployment-specific configuration review, dependency monitoring, penetration testing, or ongoing security maintenance.

The finding was fixed in the working tree. A Git commit could not be created because `d:\projects\tools\my-tools` is not inside a Git repository.
