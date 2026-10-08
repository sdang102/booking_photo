# Security operations before public launch

This document records the operational choices prepared in Group 3. It does not
authorize running migrations or changing the production project.

## Migration order and impact

Apply migrations in filename order. Group 3 adds:

1. `202610080002_launch_readiness.sql`
2. `202610080003_group2_reliability.sql`
3. `202610090001_group3_security.sql`

The Group 3 migration:

- removes the private `availability.reason` value from the anonymous calendar
  projection; photographer pages still read it from the RLS-protected table;
- returns public author avatars only for profiles owning a public review;
- counts reactions only for public reviews and caps each helper input at 100 ids;
- allows `check_booking_slot` only for authenticated sessions and only for the
  three fixed launch shifts; database constraints remain authoritative;
- limits administrator Storage update/delete policies to `site-assets`,
  `portfolio`, `services`, `locations`, `avatars`, and `review-media`.

The migration does not delete users, roles, rows, buckets, tables, or files.

## CSP rollout

`next.config.ts` sends CSP as `Content-Security-Policy-Report-Only`. It permits
the current Supabase project, Unsplash images, local assets and the current
inline styles used by Next.js. The inline theme initializer is covered by a
SHA-256 hash. Keep the script text and its hash source in `next.config.ts`
synchronized if that script changes.

Before enforcing CSP:

1. collect violations in a staging environment;
2. remove unnecessary sources and remaining inline script/style allowances;
3. configure a report endpoint (`report-to`/`report-uri`) if a monitoring
   provider is selected;
4. change the header name to `Content-Security-Policy` only after login,
   Supabase realtime/auth, images, uploads and every public route pass smoke
   tests.

A nonce was intentionally not introduced because Next.js 16 requires dynamic
rendering for nonce-bearing pages, which would disable the current static/ISR
benefits across the site.

## Supabase Auth abuse controls

Before launch, review these settings in the Supabase dashboard without changing
them blindly:

- Authentication > Rate Limits: verify email, sign-in, sign-up, token refresh,
  password recovery and OTP limits match expected traffic.
- Authentication > Bot and Abuse Protection: enable CAPTCHA for sign-up,
  sign-in and password recovery after choosing a supported provider and adding
  its site/secret keys through the deployment secret manager.
- Authentication > Email: configure custom SMTP before raising email limits.

Application buttons are disabled while important auth, booking, review and
profile requests are in flight. These client guards improve UX but do not
replace server-side rate limits, CAPTCHA or database constraints.

## Public media decision

The `avatars` and `review-media` buckets remain public by product decision.
Anyone who knows a public object URL can download it. Review database reads and
Storage policies still hide undiscoverable paths for non-public reviews, but a
previously shared URL cannot be treated as private. Moving these buckets to
private signed URLs is a separate product migration.

## Error monitoring integration point

`src/lib/reportError.ts` is the single integration point. It logs only normalized
error metadata and small caller-supplied context in development; callers must
not pass request payloads, phone numbers, email addresses, access tokens or
passwords. Production is a no-op until the owner selects a provider.

Shortlist (pricing and quotas must be rechecked immediately before selection):

- [GlitchTip](https://glitchtip.com/pricing/): hosted free tier currently lists
  1,000 events/month, or it can be self-hosted. It is lightweight and supports
  Sentry-compatible SDKs; self-hosting adds upgrade, database and alerting
  operations.
- [Better Stack](https://betterstack.com/pricing): the personal-project tier
  currently lists error tracking, logs, traces, uptime and session replay. It
  provides a broad operations view and first-party Next.js guidance; the wider
  telemetry surface needs careful sampling and PII/replay configuration.
- [Rollbar](https://rollbar.com/pricing): the free tier currently lists 5,000
  error occurrences and 1,000 replays/month. It is focused and quick to adopt;
  advanced retention, rate controls and higher volume move to paid tiers.

Whichever provider is selected, send only the normalized fields already
produced by `reportError`, disable request bodies and sensitive breadcrumbs,
set environment/release tags, sample noisy errors, and add its ingest domain to
the CSP. No provider SDK, runtime dependency, account or external connection is
installed by Group 3.
