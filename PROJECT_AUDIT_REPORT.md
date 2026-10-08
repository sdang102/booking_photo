# PROJECT AUDIT REPORT

> Audit date: 2026-10-07 (Asia/Bangkok)
> Scope: source code, configuration, SQL schema/migrations, local deployment metadata, dependency/import search, static assets, and lint.
> Constraint honored: no application code, package, database, API, or existing file was changed. This report is the only new file. Secret values are not reproduced.

## 1. Project Overview

FIN PHOTO is a Vietnamese photography portfolio and booking website. It combines a public editorial site, customer authentication and booking tracking, a photographer workspace, and an administrator CMS/reporting workspace.

### User-facing behavior

- Public visitors can view the home page, photographer/about page, service packages, portfolio archive, individual albums, and published reviews.
- A visitor can open the booking wizard, choose one of three fixed two-hour shifts, enter an outdoor shoot address and contact details, and submit a booking request.
- In the current production database policy, booking insertion is only allowed to an authenticated user whose `user_id` equals `auth.uid()`. The UI itself does not require login, so anonymous submission reaches the insert step but should be rejected by RLS. This is a functional mismatch, not an inference.
- Registered customers can view active bookings, edit their profile, and review a completed booking. A review is published immediately by the current RPC.
- Photographers see only bookings assigned to their own account (enforced by RLS), advance booking status, add internal notes, view their schedule/reviews, and block shifts.
- Administrators maintain homepage content, services, add-ons, categories, albums, locations, FAQs, site settings, media and review moderation, and view revenue summaries. Admin does not operate booking status after migration `202609270006`; that responsibility belongs to the photographer role.

### Main flows

1. Public browsing: Next.js client page -> Supabase PostgREST query -> client state -> render, usually with hard-coded/mock fallback content.
2. Authentication: Supabase Auth email/password -> profile plus role RPCs -> `AuthContext` -> route redirect/UI guard.
3. Booking: service/date/shift/contact form -> public schedule and availability RPCs -> client validation -> `bookings` insert -> PostgreSQL triggers/constraints -> assigned photographer.
4. Portfolio: `portfolio_albums` plus nested category/location/images query -> browser maps all rows -> archive or album rendering.
5. Content administration: generic `AdminCrudPanel` -> direct PostgREST CRUD guarded by admin RLS.
6. Image administration: CMS fields store compressed WebP data URLs directly in text columns; album images primarily use Supabase Storage; the separate Media Library stores Base64 in the `media` table.
7. Payment: no checkout, gateway, webhook, or payment capture UI exists. Current policy is full payment at the shoot; legacy payment/deposit columns and a `payments` table remain.

## 2. Tech Stack

### Frontend

| Area | Technology | Evidence/notes |
|---|---|---|
| Framework | Next.js App Router 16.3.6 | `src/app`, `proxy.ts`, package manifest |
| UI runtime | React/React DOM 19.2.8 | Client components dominate all data-bearing pages |
| Language | TypeScript 5, strict mode | `tsconfig.json`; `allowJs` also enabled |
| Styling | Tailwind CSS 4 through `@tailwindcss/postcss`, plus one 1,891-line global CSS file | No separate UI component library |
| Icons | `lucide-react` 1.48.0 | Used in 39 source files |
| Animation | GSAP 3.15.0 plus native IntersectionObserver/CSS animation | GSAP is used only by the legacy-looking `PortfolioGallery`; active public pages use `PublicMotionRoot` |
| State | React local state and `AuthContext` | No Redux/Zustand/etc. |
| Forms | Native React form handlers | No form library |
| Data fetching | Supabase JS query builder/RPC/Auth/Storage from browser | No React Query/SWR/Axios; no Next server action or loader |
| Images | `next/image`, native `<img>`/`<picture>`, Canvas compression | Remote hosts allowed: Unsplash and configured Supabase public Storage |

### Backend and data layer

| Area | Technology | Notes |
|---|---|---|
| Runtime/BFF | Next.js proxy only | There are no `route.ts` API endpoints and no server actions |
| Backend service | Supabase | Browser calls Auth, PostgREST, PostgreSQL RPC and Storage directly |
| Authentication | Supabase Auth via `@supabase/ssr` 0.12.7 and `@supabase/supabase-js` 2.117.2 | Cookie session for SSR/proxy; browser session managed by Supabase |
| Authorization | Next proxy + client `RoleGuard` + PostgreSQL RLS/RPC checks | RLS/RPC is the authoritative data boundary |
| Validation | Handwritten TypeScript plus PostgreSQL checks/triggers | Phone/date/shift/review validation is duplicated client/database-side |
| ORM | None | Supabase query builder maps to PostgREST; SQL migrations define DB logic |
| Upload | Browser Canvas -> WebP Base64; Supabase Storage upload for album images | No multipart Next endpoint |
| Image processing | Browser Canvas, max source 20 MB, max dimension 1920, WebP quality 0.84 | No server-side Sharp pipeline |
| Logging | `console.warn` only | No structured logger/telemetry |

### Database and infrastructure

- PostgreSQL managed by Supabase, with Supabase Auth and Storage.
- Migration system: ordered SQL files under `supabase/migrations`. `supabase/schema.sql`, `booking_photo.sql`, and `reviews_migration.sql` are older standalone SQL and are not the authoritative final state.
- Vercel project metadata links this repository to project `booking-photo`; exact production URL and regions are not committed.
- Environment variables observed by name only: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (example/script), `VERCEL_OIDC_TOKEN` (local), and code references `NEXT_PUBLIC_USE_DEMO_BOOKINGS` although it is absent from the inspected env files.
- No custom CDN is configured. Next Image Optimization can proxy configured remote images; raw `<img>` and `<picture>` URLs bypass it. Supabase public Storage and Unsplash provide their own delivery endpoints.

## 3. Folder Structure

```text
photo_booking/
├── public/                       static logo, hero, two large photographer JPEGs, template SVGs
├── scripts/
│   └── create-test-users.mjs     privileged local account/role bootstrap script
├── src/
│   ├── app/                      App Router pages and layouts
│   │   ├── admin/                admin dashboard, dynamic CMS section, media/reviews, album images
│   │   ├── photographer/         photographer dashboard, bookings, availability, schedule, reviews
│   │   ├── portfolio/[slug]/     album detail/lightbox
│   │   └── ...                   public/customer pages
│   ├── components/
│   │   ├── admin/                generic CRUD panel and admin shell
│   │   ├── photographer/         photographer shell, status badge, availability manager
│   │   ├── motion/               active public motion root plus two apparently unused components
│   │   └── ...                   public, auth, booking and review UI
│   ├── lib/
│   │   ├── auth/                 roles, permissions, status-transition map
│   │   ├── context/              global browser AuthContext
│   │   ├── data/                 development/mock content
│   │   ├── services/             Supabase query/RPC/storage functions
│   │   └── supabase/             browser and server client factories
│   ├── types/                    application interfaces/unions
│   └── proxy.ts                  protected-route authentication/role proxy
├── supabase/
│   ├── migrations/               canonical ordered schema evolution
│   ├── schema.sql                older baseline, not equivalent to final migrations
│   └── *.sql                     standalone legacy/manual SQL artifacts
├── next.config.ts                remote image allowlist
├── package.json
└── .vercel/                      ignored local Vercel link metadata
```

### Important dependency chains

- `src/app/layout.tsx` -> `AuthProvider` -> Supabase browser client -> profile and `has_role` RPCs.
- Public pages -> `PublicSiteHeader` -> `Navbar`, `AuthModal`, `MyBookingsModal`; when signed in, this also starts booking polling.
- `/booking` -> `FinBookingPage` -> `BookingWizard` -> `bookingService` -> schedule/availability RPCs and `bookings` insert.
- `/admin/[section]` -> `AdminSectionPage` -> `AdminCrudPanel` -> table selected by section configuration.
- Photographer layout -> `PhotographerShell` -> `RoleGuard` and booking polling; child pages call `bookingService`/`reviewService`.
- Portfolio pages -> `contentService.getPortfolioAlbums` -> albums/categories/locations/all nested images.

## 4. Roles

| Role | Main access | Database authority |
|---|---|---|
| `user` | Public pages, profile, own bookings, booking creation, completed-booking review | Own profile and bookings; insert own booking; create review through RPC |
| `photographer` | `/photographer/**`, assigned booking details/status, availability, assigned reviews | Assigned bookings/payments/reviews and own availability; secured RPC status/note updates |
| `admin` | `/admin/**`, CMS/reviews/media/revenue | Broad CRUD on content tables; read-only report access to bookings/payments after separation migration |

Roles live in `roles` and `user_roles`. `normalizeRoles` also understands legacy values `client` and `photographer_admin`. A user can own both admin and photographer roles, but admin no longer implicitly inherits photographer permission.

## 5. Routes

All real page routes discovered under `src/app` are below. “API called” names the actual Supabase operation/service because the repository contains no Next API handlers.

| Route | Purpose | Role access | Main component | API/data required | Important dependencies |
|---|---|---|---|---|---|
| `/` | Public marketing homepage; redirects staff to workspace unless `?preview=1` | Public | `HomePage`, `Fin*` sections | visible `homepage_sections`; public albums; header loads services and signed-in user's bookings | `PublicMotionRoot`, `PublicSiteHeader` |
| `/about` | Photographer portfolio/about narrative | Public | `FinAboutPage` | all public albums | local `/DSC*.JPG`, selected works |
| `/services` | Packages, comparison, add-ons, FAQ | Public | `FinServicesPage` | services + active `service_addons`; mock fallback | header performs another services fetch |
| `/portfolio` | Album archive and category filter | Public | `FinPortfolioArchive` | public albums including all images; active categories | raw responsive cover images |
| `/portfolio/[slug]` | Full album gallery/lightbox | Public | `PortfolioAlbumPage` | currently fetches every public album and image, then finds slug | Next Image gallery; raw hero/lightbox image |
| `/reviews` | Published review archive/filter/detail | Public | `ReviewsPage` | public reviews joined to booking/album | mock fallback, hash-based detail |
| `/booking` | Three-step booking wizard | Public UI; DB insert effectively authenticated-only | `FinBookingPage`, `BookingWizard` | services, public schedule RPC, public availability RPC, booking insert | fixed shifts, client validation |
| `/login` | Login and registration | Public | `LoginPage` | Supabase Auth; profile and role RPCs after login | supports `next`, `tab`, `confirmed` query params |
| `/profile` | Edit account and show active count | Any authenticated role (client guard) | `Profile` | Auth update, profile update, own bookings | no proxy match; protected by UI plus RLS |
| `/my-bookings` | Simple active-booking list | Any authenticated role (client guard) | `MyBookings` | own bookings | hides completed/cancelled |
| `/admin` | CMS/revenue overview | Admin | `AdminDashboardPage` | all RLS-visible bookings | protected by proxy and guard |
| `/admin/[section]` | Dynamic CMS/revenue section | Admin | `AdminSectionPage` | table CRUD or all bookings for `revenue` | valid sections are defined in component, unknown values render not-found message |
| `/admin/albums/[id]` | Album image CRUD/upload/replace | Admin | `AlbumImagesPage` | album, its images, Storage `portfolio` | Base64 fallback if bucket missing |
| `/admin/media` | Search/upload/delete media rows | Admin | `MediaPage` | up to 100 `media` rows | images stored as Base64 in DB |
| `/admin/reviews` | Review visibility/featured/album link/delete | Admin | `AdminReviewsPage` | all reviews, album lookup by slug on update | dropdown is based on mock albums, not DB albums |
| `/photographer` | Upcoming assigned jobs and pending count | Photographer | `PhotographerHome` | RLS-filtered bookings, polling 15s | proxy, shell polling also active |
| `/photographer/bookings` | Search/filter assigned bookings | Photographer | `PhotographerBookings` | RLS-filtered bookings | filters in JavaScript |
| `/photographer/bookings/[id]` | Booking operation/detail | Assigned photographer | `BookingDetail` | all assigned bookings then JS `.find`; status/note RPCs | call/Zalo/maps outbound links |
| `/photographer/schedule` | Grouped future schedule | Photographer | `Schedule` | all assigned bookings | JS filter/sort/group |
| `/photographer/availability` | Block/unblock own shifts | Photographer | `AvailabilityManager` | assigned bookings + protected availability rows | creates/deletes one row per shift |
| `/photographer/reviews` | Reviews for assigned bookings | Photographer | `PhotographerReviewsPage` | Auth user then review/booking join | RLS plus explicit photographer filter |

Next also exposes the generated favicon route. There are no custom HTTP API routes.

## 6. Component Map

### Active shared/core components

- `PublicSiteHeader`: used by all major public experiences; owns auth modal, booking modal, services state, booking state, focus listener and 15-second polling.
- `Navbar`: public desktop/full-screen/mobile navigation, account menu and unread-booking marker.
- `PublicMotionRoot`: shared progress/reveal/parallax behavior; walks DOM targets using IntersectionObserver and scroll handlers.
- `FinPhotoSections`: shared public homepage/about/services/reviews footer and content sections.
- `ResponsiveAlbumImage`: raw `<picture>` cover rendering with lazy loading and optional mobile source.
- `AuthModal`, `RoleGuard`, `LogoutButton`, `BrandLogo`: authentication/account primitives.
- `BookingWizard`, `BookingCalendar`: booking state machine and calendar/shift availability.
- `MyBookingsModal`, `ReviewForm`, `BookingStatusBadge`: customer booking/review presentation shared with photographer views.
- `AdminShell`/`PhotographerShell`: workspace layout, navigation, role guard and account controls.

### Logic-heavy/fetching components

- `AuthProvider`: auth subscription, sign-in/up/out, profile reads/updates and two role RPCs per profile sync.
- `BookingWizard`: two availability requests on mount, validation, insert and refetch on failure.
- `AdminCrudPanel`: generic direct-table CRUD and image-to-Base64 conversion for nine CMS configurations.
- `AlbumImagesPage`: concurrent upload, insert, cleanup, replacement and Storage deletion.
- `AvailabilityManager`: merges assigned bookings and availability, conflict UI, multi-row blocking/unblocking.
- `PortfolioAlbumPage`: full gallery/lightbox zoom, pan, pinch and viewport state.
- `PortfolioGallery`: GSAP shared transition and three repeated album presentations, but not imported by an active route.

### Duplication/legacy signals

- `Hero`, `HomepageSections`, `EditorialServices`, `LuxuryExperience`, `AvailabilityCalendar`, `PhotographerCard`, `PortfolioGallery`, `ReviewsSection`, `EditorialMarquee`, and `FullscreenPhotoBreak` have no imports from active source entry points. Some export helpers used nowhere; they appear to be earlier UI generations.
- `AuthModal` and `/login` independently implement almost the same login/register form.
- `/my-bookings` and `MyBookingsModal` duplicate booking presentation with different visibility rules.
- `portfolio` and `albums` admin configurations target the same table with nearly identical fields.
- Public portfolio has both the active `FinPortfolioArchive` and unused, more elaborate `PortfolioGallery`.
- `globals.css` contains styles accumulated for multiple UI generations (1,891 lines, 37 `!important`, 19 media queries), so unused CSS is likely, but selector-level removal cannot be declared safe from static search alone.

## 7. API Map

There is no internal `/api/*`. The following is the effective external API surface called by the browser.

| Method/operation | Endpoint/resource | Purpose | Called by | Auth | Database/storage | Response/status |
|---|---|---|---|---|---|---|
| SELECT | `services` + `categories(slug)` | Packages | public services/header/booking | Public RLS | services, categories | ACTIVE |
| SELECT | `portfolio_albums` + category/location/images | Portfolio/archive/detail/about/home | content service | Public rows only | 4 tables | ACTIVE; over-fetching |
| SELECT | `homepage_sections` | Home CMS content/motion/craft | home | Public visible | homepage_sections | ACTIVE |
| SELECT | `categories` | Portfolio filters/admin selectors | archive/admin | Public active/admin | categories | ACTIVE |
| SELECT | `locations` | Location content | content service; no active caller found | Public active | locations | POSSIBLY UNUSED path |
| SELECT | `faqs` | Public FAQs | content service; no active caller found | Public visible | faqs | POSSIBLY UNUSED path |
| SELECT | `service_addons` | Service extras | services page | Public active | service_addons | ACTIVE |
| SELECT/INSERT/UPDATE/DELETE | configured CMS table | Admin generic CRUD | `AdminCrudPanel` | Admin RLS | homepage/services/addons/categories/albums/locations/faqs/settings | ACTIVE |
| SELECT | `portfolio_images`, `portfolio_albums` | Album image editor | album admin | Admin RLS | both tables | ACTIVE |
| INSERT/UPDATE/DELETE | `portfolio_images` | Manage album image metadata/URL | album admin | Admin RLS | portfolio_images | ACTIVE |
| UPLOAD/REMOVE | Storage bucket `portfolio` | Album binaries | album admin | Admin Storage policy | storage.objects | ACTIVE |
| SELECT/INSERT/DELETE | `media` | Media library | media service | Admin RLS | media | ACTIVE UI, weak integration |
| SELECT x5 + Storage REMOVE | content image references | Protect deletion of non-DB media | `deleteMedia` | Admin | content tables/storage | ACTIVE only when bucket != `database` |
| RPC | `get_public_booking_schedule` | Anonymous schedule without PII | booking wizard | anon/auth | bookings | ACTIVE |
| RPC | `get_public_availability` | Public future blocks | booking wizard | anon/auth | availability | ACTIVE |
| INSERT | `bookings` | Create booking | `createBookingPhoto` | authenticated own user by RLS | bookings + triggers | ACTIVE; anonymous mismatch |
| SELECT `*` | `bookings` | Assigned/all/own lists via RLS | booking/admin/photographer services | authenticated | bookings | ACTIVE; unbounded |
| RPC | `photographer_advance_booking` | Controlled status transition | booking detail | assigned photographer | bookings | ACTIVE |
| RPC | `update_photographer_note` | Internal note | booking detail | assigned photographer | bookings | ACTIVE |
| SELECT/INSERT/DELETE | `availability` | Photographer blocks | availability manager | own photographer | availability | ACTIVE |
| SELECT | `reviews` joined booking/album | Public/admin review lists | pages/services | Public published or admin | reviews/bookings/albums | ACTIVE |
| SELECT | assigned `reviews` join | Photographer reviews | photographer reviews | Photographer | reviews/bookings/albums | ACTIVE |
| RPC | `review_completed_booking` | One review for own completed booking | review form | authenticated owner | reviews/bookings | ACTIVE |
| UPDATE/DELETE | `reviews` | Moderation | admin reviews | Admin RLS | reviews | ACTIVE |
| Auth | `signInWithPassword` | Login | context | Public credentials | Supabase Auth | ACTIVE |
| Auth | `signUp`, `resend` | Register/confirm | context | Public | auth.users trigger -> profiles/role | ACTIVE |
| Auth | `getUser` | Verify protected route/current photographer | proxy/review service | Cookie/browser session | Auth | ACTIVE |
| Auth | `updateUser`, `signOut` | Profile auth fields/logout | context | Current user | Auth | ACTIVE |
| RPC x2 | `has_role` | Resolve admin/photographer | proxy and profile sync | Current user | user_roles/roles | ACTIVE, repeated |
| UPDATE | `profiles` | Profile data | AuthContext | Own profile RLS | profiles | ACTIVE |

No service calls another third-party business API. Outbound user links only open Google Maps, telephone and Zalo.

## 8. Database Schema

The effective model must be reconstructed by applying all ordered migrations. Key enums: `app_role`, `booking_status`, `payment_status`, `availability_status`.

| Table | Purpose and columns (final significant state) | Keys/relations/indexes |
|---|---|---|
| `profiles` | User profile: `id`, required `full_name`, required `email`, nullable validated `phone`, `avatar_url`, timestamps | PK/FK `id -> auth.users` cascade; self read/update RLS |
| `roles` | Role dictionary: smallserial `id`, unique enum `name`, created time | PK id, unique name |
| `user_roles` | Many-to-many role membership: `user_id`, `role_id`, created time | composite PK; cascades to auth user/role |
| `site_settings` | Website identity/contact/social/policies/SEO, `default_deposit=0`, display order, timestamps | UUID PK; public read, admin write |
| `homepage_sections` | keyed content blocks, title/subtitle, JSON `content`, `image_url`, visibility/order, timestamps | UUID PK, unique `section_key` |
| `categories` | CMS taxonomy, unique slug, active/order | UUID PK; referenced optionally by services/albums |
| `services` | category, name/slug, descriptions, price, forced-zero deposit, duration/counts, cover/features/terms, featured/active/order, timestamps | UUID PK, unique slug; category FK `SET NULL` |
| `service_addons` | title/description/price/label, active/order, timestamps | UUID PK; public active/admin CRUD |
| `locations` | name/area/address/description/cover/travel fee/active/order/timestamps | UUID PK |
| `portfolio_albums` | category/location, title/unique slug, description/date/location text, desktop/mobile covers, featured/public/order/timestamps | UUID PK; category and location set null; one-to-many images |
| `portfolio_images` | required album, optional storage path, required URL, caption/alt/order, width/height, created time | UUID PK; album FK cascade |
| `availability` | date/time range, status/reason, assigned `photographer_id`, timestamps | UUID PK; photographer FK profile cascade; `(photographer_id,date,start_time)` index; end > start |
| `bookings` | code, customer/user/service/location/photographer, shoot address/date/times, notes, service/fee snapshots, totals, forced-zero deposit, status/payment status, timestamps | UUID PK; unique booking code; user/location/photographer set null; service now set null; global GiST overlap exclusion; photographer/date/time index; many checks/triggers |
| `payments` | booking, amount, method/transaction/status/paid time/timestamps | UUID PK; booking FK restrict. No active application writer/reader beyond RLS/report conceptual model |
| `reviews` | unique booking, optional user/album, rating/comment, public/featured, timestamps | UUID PK; booking unique/restrict; user/album set null; one per booking |
| `faqs` | question/answer/visibility/order/timestamps | UUID PK |
| `media` | uploader, bucket/path/public URL/file metadata/category/JSON/timestamps | UUID PK; unique storage_path |

Legacy/conditional objects: `booking_photo` is explicitly retained for audit; old incompatible `bookings`/`reviews` may have been renamed `bookings_legacy`/`reviews_legacy`. These are not read by current application code.

### Relationships

```text
auth.users 1--1 profiles
auth.users N--M roles (through user_roles)
profiles (photographer) 1--N bookings
profiles (photographer) 1--N availability
auth.users (customer) 1--N bookings
categories 1--N services
categories 1--N portfolio_albums
locations 1--N portfolio_albums
locations 1--N bookings
services 1--N bookings (nullable after service deletion; snapshots preserve history)
portfolio_albums 1--N portfolio_images
bookings 1--N payments
bookings 1--0..1 reviews
portfolio_albums 1--N reviews (optional link)
```

### Database enforcement relevant to booking

- Auth/profile/booking phone normalization and Vietnamese mobile checks.
- Working hours 08:00-20:00, future time and minimum 30 minutes.
- Final allowed shifts are exactly 08:30-10:30, 13:30-15:30, and 18:00-20:00.
- Maximum two non-cancelled bookings per photographer/day under advisory transaction lock.
- GiST exclusion prevents overlapping active bookings globally (photographer is not part of the constraint).
- Availability insert/update cannot overlap that photographer's confirmed/active work.
- Booking insert trigger resolves active service/location and overwrites all price snapshots/totals; deposit is forced to zero.

## 9. Database Query Map

| Function/file | Query shape | Filters/order/joins | Used by | Observation |
|---|---|---|---|---|
| `getServices` | services `select('*, categories(slug)')` | order price; no explicit `is_active` because RLS filters public | header/services/booking | same data repeatedly fetched on navigation/header |
| `getPortfolioAlbums` | albums `select('*, categories(slug), locations(name), portfolio_images(*)')` | optional public filter; order album only; image sort in JS | home/about/archive/detail | loads all image rows even when only covers or one slug is needed |
| `getPortfolioAlbum` | calls previous query then `.find(slug)` | JS filter | album detail | highest-confidence over-fetching issue |
| `getHomepageSections` | `select('*')` | visible/order | home | no cache |
| `getCategories`, `getServiceAddons` | explicit fields | active/order | archive/services | appropriate shape, no cache |
| `createBookingPhoto` | two RPC reads then insert/select/single | availability checked in JS; DB rechecks | booking | safe concurrency ultimately relies on DB constraint/trigger |
| `getAllBookings` | `select('*')` | order created desc, no limit | admin and all photographer pages | RLS scopes rows, but all history and columns are transferred |
| `getBookingById` | calls all-bookings then `.find` | JS filter | detail | should be one row conceptually; currently full table scope |
| `getCustomersSummary` | calls all-bookings | all grouping/sort in JS | no active caller found | POSSIBLY UNUSED and unbounded |
| `getLockedSlots` | all bookings + availability RPC | JS filter/map | no active caller found | POSSIBLY UNUSED duplicate availability purpose |
| `updateBookingStatus` | first loads all bookings, then RPC | JS transition precheck plus DB transition | booking detail | extra read before every status write |
| `createAvailabilityBlock` | loads all bookings, JS conflict, then insert | DB also validates | availability manager | extra unbounded query for each shift; multi-shift block repeats it concurrently |
| `getReviews` | reviews `*` + booking/album joins | optional public; order; featured sort and limit in JS | home/modal/reviews/admin | `limit` is applied after downloading all rows |
| `canReviewBooking` | all bookings then all reviews | two JS `.find/.some` | review submission | two unbounded requests before RPC that enforces same rule |
| `listMedia` | media `*` | order desc, limit 100, optional ilike | media page | bounded; Base64 `public_url` makes each row potentially large |
| `deleteMedia` | five parallel reference queries | exact URL, limit 1 | media delete | acceptable fan-out but skipped for database/Base64 media |
| `AdminCrudPanel.load` | configured table `select('*')` | order display_order, no limit | every CMS section | settings singleton still requests all rows |

No classic ORM N+1 loop was found in public reads. Query-in-loop behavior exists in upload (`media` inserts sequentially), multi-shift availability (each create calls `getAllBookings`), and test user bootstrapping. The main pattern is unbounded reads plus JavaScript filtering/sorting rather than N+1 relations.

## 10. Authentication Flow

### Register

`/login` or `AuthModal` -> local name/email/password/phone validation -> `AuthContext.register` -> `supabase.auth.signUp` with name/phone metadata and email redirect -> `auth.users` trigger validates phone -> `handle_new_user` inserts `profiles` and default `user` role -> either active session or email-confirmation message.

Password hashing is wholly managed by Supabase Auth; application source never stores or hashes a password. The local test-user script sends hard-coded development passwords to the Admin Auth API, but this report does not reproduce them.

### Login/current user

`signInWithPassword` -> `profileFromSupabase` executes in parallel: profile select + admin role RPC + photographer role RPC -> normalized `UserProfile` stored in React state and duplicated to localStorage key `photo_user_session`. Supabase owns the real cookie/local browser auth session; the localStorage profile is not treated as authorization by proxy/RLS.

`AuthProvider` subscribes to `onAuthStateChange`, then repeats profile/role loading for auth events. Login itself also calls `profileFromSupabase`, so a successful sign-in can cause duplicated profile and role requests.

### Route protection

- `proxy.ts` matches `/admin/:path*` and `/photographer/:path*`, calls verified `auth.getUser`, then two `has_role` RPCs, and redirects to login/forbidden.
- Workspace layouts additionally wrap content in `RoleGuard` using client context.
- `/profile` and `/my-bookings` are not proxy-matched; they use `RoleGuard` only for presentation, while RLS protects actual data.
- Admin/photographer mutations are not trusted to UI guards; database RLS and security-definer RPC role/assignment checks enforce them.

### Logout

Confirmation modal -> `supabase.auth.signOut` -> remove cached profile -> clear context -> `window.location.replace('/')` in `LogoutButton`.

## 11. Booking Flow

```text
Customer selects service
  -> BookingWizard loads get_public_booking_schedule + get_public_availability
  -> choose date and one of three fixed shifts
  -> isRangeAvailable checks past time, hours, daily count, overlaps and blocks
  -> enter outdoor address/name/phone/email/note
  -> review total (no payment)
  -> createBookingPhoto repeats both availability RPCs
  -> INSERT bookings
  -> DB assigns default photographer
  -> DB normalizes phone, validates active service/address/time/shift
  -> DB checks availability, per-day limit and overlap exclusion
  -> DB snapshots service price and forces deposit=0
  -> pending booking returned
```

Status lifecycle is `pending -> confirmed -> checked_in -> shooting -> completed`; photographer may cancel pending/confirmed. The RPC verifies photographer role and assignment and locks the row before update.

Duplicate/conflicting booking protection is strong at the database concurrency layer: a GiST exclusion constraint serializes overlapping active bookings, while advisory locking enforces two bookings/day. Client prechecks improve UX but are not the source of truth. One caveat is that the exclusion is global rather than per photographer, so multiple photographers still cannot accept overlapping sessions.

Payment is “cash/full payment at shoot.” Booking starts `unpaid`, deposit is always zero, and the app has no mechanism that creates `payments` or marks a booking paid. Revenue pages sum booking `total_price`; they do not sum settled payments.

## 12. Album & Image Flow

### Storage modes

1. Static files in `public`: logo, hero, two photographer portraits. The portrait files are about 3.08 MB and 2.99 MB each.
2. Unsplash remote URLs: seed/fallback/editorial imagery with query-level width/quality.
3. Supabase public Storage `portfolio`: album upload target, WebP blob, one-year cache control.
4. Base64 data URLs in PostgreSQL text fields: generic CMS images and Media Library. Album upload also falls back to a data URL if the bucket returns not found.

### Upload/delete

- `imageFileToBase64` rejects non-images and sources over 20 MB, scales longest dimension to 1920, and encodes WebP quality 0.84 in the browser.
- Generic CMS `ImagePicker` writes the resulting full data URL directly into columns such as `cover_image`/`image_url`.
- Media Library inserts the Base64 into `media.public_url`; no content picker consumes those media records.
- Album editor converts to Base64, then converts that data URL back to a Blob and uploads to `portfolio`. It records `storage_path` and public URL. Collected width/height are not inserted into `portfolio_images`.
- Album image deletion removes the database row first, then the Storage object. A Storage failure after row deletion can orphan the object. Replacement updates the row then removes the old object.

### Delivery/optimization

- `next/image` is used for many editorial images and every gallery frame, giving responsive optimization/lazy loading (except priority/preload images).
- Album archive covers use raw `<picture><img loading="lazy">`; they bypass Next Image Optimization.
- Album hero and lightbox use raw `<img>` without explicit lazy behavior; gallery frames use `next/image`.
- Album query returns every image for every album on home/archive/about pages even though those pages only render covers.
- Individual album renders all gallery frames at once; no pagination/virtualization exists. Browser-native/Next lazy loading delays off-screen image bytes, but all metadata and DOM nodes are created.
- Base64 images cannot benefit from conventional CDN URLs and increase PostgREST JSON payload roughly by Base64 overhead; CMS content/list calls can therefore be heavy.
- Supabase Storage buckets allow 20 MB portfolio objects, 10 MB site/service/location objects and 5 MB avatars, but browser conversion generally caps output dimensions rather than output byte size.

The album detail is the page most likely to load the largest image workload; the portfolio query feeding it also retrieves all other public albums/images.

## 13. Admin Flow

Login -> proxy verifies session and admin role -> `AdminShell`/`RoleGuard` confirms context -> dashboard loads all visible bookings for derived revenue -> module links open:

- Generic CRUD: homepage, services, add-ons, categories, portfolio/albums, locations, FAQ, settings.
- Album images: Storage/database image operations.
- Media: database Base64 library.
- Reviews: public/featured flags, optional album relation and permanent deletion.
- Revenue: booking totals and payment-status labels only.

Every write is performed directly from browser to Supabase. The generic panel depends on RLS for table-specific authorization. After role-separation migration, admin can read booking/payment data but cannot change appointment status or availability.

## 14. Data Fetching Map

| Page/component | Request | When/refetch | Cache behavior/issues |
|---|---|---|---|
| `AuthProvider` | profile + 2 role RPCs | auth event and explicit login | no app cache; possible duplicate after login |
| `PublicSiteHeader` | services; own bookings | mount; bookings on focus and every 15s | remounts per route; polling everywhere when signed in |
| Home | sections + all albums/images | mount | no cache |
| About | all albums/images | mount | header also fetches services |
| Services | services + add-ons | mount | header independently fetches services again |
| Portfolio | all albums/images + categories | mount | client filter only |
| Album detail | all albums/images | slug change | JS find; header requests in parallel |
| Reviews | all public reviews | mount | fallback mock; filtering local |
| Booking | services, then schedule + availability | page mount/wizard mount; availability again before insert; again on failure | services duplicate header; schedule has no subscription/polling |
| Profile | own bookings | user change | one-shot |
| Public bookings modal | all reviews | modal open and after review | header continues booking polling |
| Admin dashboard/revenue | all bookings | mount/section change | separate visits refetch all |
| Generic admin | table `*`; categories if needed | mount and after write/archive | no pagination |
| Photographer shell | all assigned bookings | mount, focus, status event, 15s | overlaps with child fetch/polling |
| Photographer home | all assigned bookings | mount, focus, 15s | duplicate simultaneous polling with shell |
| Other photographer pages | all assigned bookings/reviews | mount | child fetch duplicates shell request |
| Availability manager | assigned bookings + own blocks | mount and mutation refresh paths | each created shift triggers another all-bookings request |

No request is made on every React render; requests are effect/event driven. No explicit request cache/deduplication layer exists. Navigation between client pages remounts public headers because they are page children rather than a shared public layout.

## 15. Dependencies

### Core/used

- `next`, `react`, `react-dom`: core runtime.
- `@supabase/ssr`: browser/server clients and proxy session refresh.
- `@supabase/supabase-js`: used directly only by privileged test-user script and transitively by SSR package.
- `lucide-react`: icon system.
- Tailwind/PostCSS: build-time CSS pipeline.
- TypeScript, ESLint and Next ESLint configuration: development quality toolchain.

### Possibly unused or narrowly used

- `gsap`: imported only by `PortfolioGallery`, which itself has no active importer. Therefore the package is a high-confidence production cleanup candidate, subject to confirming no dynamic import outside the scanned source.
- No duplicated date/form/request libraries exist. Date logic is native `Date`/`Intl`; requests are Supabase-only.

`npm run lint` completed successfully with zero reported errors/warnings during this audit.

## 16. Suspected Dead Code

### High confidence unused in the active source graph

- Components with zero importers: `AvailabilityCalendar.tsx`, `EditorialServices.tsx`, `LuxuryExperience.tsx`, `EditorialMarquee.tsx`, `FullscreenPhotoBreak.tsx`, `PhotographerCard.tsx`, `PortfolioGallery.tsx`, `ReviewsSection.tsx`.
- Static template assets with zero source references: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`, and `chon-photo-saigon-logo.jpg` (the trimmed logo is used).
- `getLockedSlots` and `getCustomersSummary` have no call sites.
- `getLocations` and `getFaqs` have no active caller, although their CMS tables are managed and older `HomepageSections` would use the resulting types.
- `src/lib/supabase/server.ts` has no valid direct application import; naive name search produced false positives. Server client functionality is separately reimplemented in `proxy.ts`.
- `booking_photo.sql` and `reviews_migration.sql` describe legacy/incompatible models and are outside ordered migrations.

### Possibly unused/legacy

- `Hero.tsx` and most exports from `HomepageSections.tsx` are superseded by `FinPhotoSections`; static basename search can over-count references, so treat them as likely rather than automatically removable.
- `mockData.ts` is still actively used as development/fallback data; it is not dead, though some individual exports may be.
- `supabase/schema.sql` is an older permissive baseline and may be retained as documentation/manual bootstrap; it should not be treated as the current production schema.
- `SEED_BOOKINGS` and localStorage fallbacks only execute in development and/or with `NEXT_PUBLIC_USE_DEMO_BOOKINGS`; retained demo behavior, not production code.

### Debug/comment findings

- No `console.log` was found in application runtime; `bookingService` contains several `console.warn` fallback messages. The account seed script intentionally logs progress.
- No meaningful TODO/FIXME backlog or large commented-out application implementation was found.

## 17. Performance Problems

| Severity | Problem | Location/evidence | Why slow / affected feature |
|---|---|---|---|
| CRITICAL | Full nested portfolio graph fetched for cover lists and one album | `contentService.getPortfolioAlbums/getPortfolioAlbum` | Payload grows with every image and album; affects home, about, portfolio and album |
| CRITICAL | Base64 images stored/selected in database rows | `AdminCrudPanel`, `mediaService` | Large JSON, DB/storage/bandwidth overhead, no CDN URL caching; admin/public image content |
| HIGH | Signed-in public header polls bookings every 15s on every public page | `PublicSiteHeader` | Repeated unbounded `select *`, focus refetch; all authenticated public navigation |
| HIGH | Photographer shell and home both poll the same data every 15s | `PhotographerShell`, photographer home | Two concurrent polling loops plus child requests; photographer workspace |
| HIGH | `getAllBookings` is unbounded `select('*')` | booking service | transfers PII/all columns/history; admin, photographer, profile operations |
| HIGH | Single-booking operations load all assigned bookings | `getBookingById`, status precheck | unnecessary table transfer and client filtering; booking detail/status |
| HIGH | Media list can return 100 full Base64 blobs | `listMedia select('*').limit(100)` | potentially very large response/DOM memory; admin media |
| HIGH | Active pages are almost entirely client-rendered and fetch after hydration | all major public `use client` pages | loading waterfalls, weaker first content/SEO, duplicated navigation fetches |
| MEDIUM | Services fetched twice on services and booking pages | `PublicSiteHeader` plus page component | duplicate request/data mapping |
| MEDIUM | Reviews `limit` applied after full download | `reviewService.getReviews` | homepage/modal callers can download all reviews |
| MEDIUM | Review eligibility reads all bookings and all reviews before secured RPC | `canReviewBooking` | redundant network/data; completed booking review |
| MEDIUM | Multi-shift availability creation repeats all-bookings query per shift | `createAvailabilityBlock` called in `Promise.all` | duplicated concurrent reads; photographer blocking |
| MEDIUM | Raw album cover/hero/lightbox images bypass Next optimizer | `ResponsiveAlbumImage`, album detail | source-sized image delivery; portfolio/album |
| MEDIUM | Two local portrait JPEGs are about 3 MB each | `public/DSC02526.JPG`, `DSC07156.jpg` | Next can optimize delivery, but source/build cache remains large; about page |
| MEDIUM | 1,891-line global stylesheet and multiple UI generations | `globals.css` | CSS parse/transfer and maintenance risk; site-wide |
| LOW | JS filtering/sorting/grouping of booking/review datasets | services/pages | becomes material only as data grows |
| LOW | Repeated role resolution with two RPCs | proxy and profile sync | protected navigation/login overhead |

## 18. Deployment Architecture

```text
Browser
  -> Vercel-hosted Next.js project (local link: booking-photo)
     -> Next rendering/static assets/Image Optimizer
     -> proxy.ts for /admin and /photographer
  -> Supabase project directly
     -> Auth
     -> PostgREST / PostgreSQL / RPC / RLS
     -> public Storage
  -> Unsplash remote image delivery
```

- Frontend host: Vercel is strongly evidenced by `.vercel/project.json`; exact domain is unknown.
- Backend/database/image host: Supabase URL is configured but redacted. Exact project region/tier is unknown.
- Build: standard `next build`, no custom output mode or runtime override.
- Serverless/persistent: Vercel execution model is not committed; proxy runs on the deployment platform, while most business requests bypass Next and go browser-to-Supabase.
- Cold start: potentially relevant to protected-route proxy/rendering, but no runtime/region evidence supports quantification.
- DB connection latency/pooling: browser uses PostgREST, not direct PostgreSQL connections; pool settings are unknown.
- Free-tier sleep and cross-region latency: UNKNOWN.
- Image bottlenecks are evidenced in Base64 DB delivery and raw remote images; a separate custom CDN is not configured.

## 19. Security Observations

### Positive controls

- `.env.local` and `.vercel` are ignored and not tracked; only variable names are documented here.
- Protected workspaces use verified Supabase user lookup in proxy and preserve refreshed cookies on redirects.
- Final RLS separates admin reporting from photographer operations and scopes photographers to assigned rows.
- Security-definer functions set `search_path=public` and important public RPC grants are explicitly controlled.
- Review creation rechecks owner/completed status in the database; status transition rechecks role, assignment and legal transition.
- Database controls phone, booking time, shift, conflicts, pricing and deposit rather than trusting client payload.

### Findings

| Severity | Observation | Evidence/impact |
|---|---|---|
| HIGH | Standalone `supabase/schema.sql` has permissive public booking-read/insert policies and is obsolete relative to migrations | Running it manually could expose booking PII; current app uses `bookings`, but file is hazardous documentation |
| HIGH | `booking_photo.sql` grants public read/update/delete/insert on legacy booking data | It is not in ordered migrations, but manual execution would be unsafe |
| MEDIUM | `reviews_migration.sql` embeds a specific admin email and legacy table relationship | Obsolete authorization by email; not in ordered migration chain |
| MEDIUM | Test-user script contains fixed development credentials | Safe only if accounts remain non-production and script/service key access is controlled; values intentionally omitted |
| MEDIUM | Booking UI permits anonymous flow while RLS requires authenticated own `user_id` | Produces failed guest submissions; relaxing RLS without redesign would create PII/abuse risk |
| MEDIUM | Base64 fallback stores content directly in public-readable rows | Upload type/size is client validated; DB does not enforce MIME semantics, and very large text payloads can be abuse/resource risk |
| MEDIUM | `AuthContext` writes the full profile including roles to localStorage | Not an authorization bypass because RLS/proxy verify independently, but local XSS could read/modify cached identity display data |
| LOW | No CSP/security headers are configured in `next.config.ts` | Increases blast radius of any injection; no source-level injection vulnerability was proven |
| LOW | Raw database error messages reach admin UI and some booking errors | May disclose schema/policy detail to authorized admin; booking path wraps most conflict cases |

No hard-coded production API key/private key was found in tracked source. The local env contains sensitive values but is ignored; none are reproduced.

## 20. Architecture Diagram

```text
PUBLIC/CUSTOMER
  |
  v
Next.js App Router client pages
  |-- PublicSiteHeader -> AuthModal / MyBookingsModal
  |-- Content pages -> contentService / reviewService
  `-- BookingWizard -> bookingService
                         |
                         v
                  Supabase browser client
                    |-- Auth
                    |-- PostgREST + RLS
                    |-- PostgreSQL RPC/triggers/constraints
                    `-- Storage (portfolio)

PROTECTED REQUEST
  -> Next proxy
  -> Supabase auth.getUser + has_role RPCs
  -> admin or photographer layout
  -> client RoleGuard
  -> direct Supabase queries

ADMIN
  -> AdminShell
  -> AdminCrudPanel / Media / Reviews / Revenue
  -> PostgREST/Storage
  -> admin RLS

PHOTOGRAPHER
  -> PhotographerShell
  -> assigned bookings / schedule / availability / reviews
  -> RLS-scoped SELECTs + secured RPC mutations

ALBUM
  -> portfolio_albums + category + location + portfolio_images
  -> image URL
     |-- Supabase public Storage
     |-- Unsplash
     `-- Base64 data URL fallback
```

## 21. Top 10 Bottlenecks

1. `getPortfolioAlbum` fetches the entire public portfolio graph before selecting one slug.
2. Every portfolio cover-list query includes every nested `portfolio_images` row.
3. Base64 image storage in content/media tables inflates DB and API payloads.
4. Media Library retrieves up to 100 Base64 images in one `select('*')` response.
5. `PublicSiteHeader` polls unbounded own bookings every 15 seconds across signed-in public pages.
6. Photographer shell and home create overlapping 15-second booking polls.
7. `getAllBookings` has no field projection, date bound or pagination.
8. Detail/status/review/availability helpers repeatedly load full booking/review collections for single-record checks.
9. Public data is client-fetched after hydration with no shared cache/deduplication layer.
10. Album gallery creates all image frames at once and raw hero/lightbox paths bypass Next optimization.

## 22. Top 10 Cleanup Candidates

These are candidates only; none were deleted.

1. Unused `PortfolioGallery.tsx` together with its sole `gsap` dependency.
2. Unused `AvailabilityCalendar.tsx`.
3. Unused `EditorialServices.tsx` and `LuxuryExperience.tsx` from an older public design.
4. Unused motion components `EditorialMarquee.tsx` and `FullscreenPhotoBreak.tsx`.
5. Unused `PhotographerCard.tsx`.
6. Unused `ReviewsSection.tsx` and likely superseded `Hero.tsx`/`HomepageSections.tsx` exports.
7. Unused service helpers `getLockedSlots`, `getCustomersSummary`, `getLocations`, and `getFaqs` after call-site verification.
8. Legacy standalone SQL: `booking_photo.sql`, `reviews_migration.sql`, and clarification/replacement of stale `schema.sql`.
9. Unreferenced Create Next App SVG assets and the untrimmed logo.
10. Duplicate surfaces/configurations: login page vs auth modal, bookings page vs modal, and admin `portfolio` vs `albums` configurations.

## 23. Information Still Unknown

- Actual production database state and whether every migration was applied in order.
- Row counts, table/storage sizes, query plans, PostgREST timing, real image dimensions and production payload measurements.
- Production Vercel URL, runtime regions, function runtime type, analytics and cache behavior.
- Supabase plan, region, backups, SMTP settings, Auth confirmation policy, rate limits and free-tier sleep behavior.
- Whether the linked Vercel project is the current production deployment or only a local association.
- Whether legacy SQL files are used by an external manual deployment process.
- Actual number of photographers; current global overlap behavior is much more restrictive if there is more than one.
- Operational process for marking payment as paid and populating the `payments` table; no code implements it.
- Whether Base64 CMS/media storage is intentional long-term architecture or a temporary fallback.
- Accessibility, Core Web Vitals and network waterfall measurements in a deployed browser; this audit is source-based only.
- Test coverage: no automated unit/integration/E2E test suite was found.

### Verification performed

- Enumerated all repository files excluding generated/dependency directories.
- Read all application entry points, service/query modules, auth/proxy code, types, configuration, and ordered migrations; followed component/service call sites.
- Compared source routes with the existing Next app-paths manifest.
- Searched imports, Supabase/Auth/Storage/RPC calls, effects/fetches, debug/TODO markers, package usage and static asset references.
- Ran `npm run lint`: success, no reported lint errors.
- Confirmed Git was clean before the audit; no existing project file was modified by the inspection commands.
