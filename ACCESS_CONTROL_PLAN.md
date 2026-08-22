# Access Control & Role Hierarchy — Implementation Plan

> Gate all four OAHRIS modules behind authentication, expose a public
> information site to visitors, and introduce three roles — **Admin**,
> **Researcher**, **Student** — with different capabilities.

| | |
|---|---|
| **Status** | 📋 **Plan only — nothing has been implemented** |
| **Scope** | All four modules + a new public site, login, and user administration |
| **Reviewed against** | `main` @ PR #26, live Supabase projects, 22 Aug 2026 |
| **Estimated effort** | ~8–12 working days, of which ~60 % is database work |
| **Blocking prerequisite** | Agreement from all four module owners (see §1) |

---

## 0. Two findings that shape everything

Before the plan, two facts that change how this must be approached.

### 0.1 Route guards are not security — the database is

The Supabase **anon key ships inside the JavaScript bundle**. Anyone who opens
DevTools can extract it and query the REST API directly, bypassing React
entirely. This is not theoretical: during the Similar Cases integration I read
all 102 specimens, every measurement and every `skeletal_inputs` row straight
from a terminal with nothing but that public key.

Current posture, verified live:

| | Today |
|---|---|
| `specimens`, `measurements`, `skeletal_inputs`, `excavation_records` | world-readable **and** world-writable via `anon` |
| `analyses`, `kgc_*` tables | world-readable and world-writable (`anon_rls_policies.sql` grants SELECT/INSERT/UPDATE/**DELETE** to `anon`) |
| Shared project signup | **open** — `disable_signup: false`, email provider on |

So "hiding the four modules" is roughly **80 % database work and 20 % frontend
work**. Hiding a `<Route>` only changes what a *polite* visitor sees. Every
access rule in this plan must be enforced by Row-Level Security; the frontend
changes are UX on top of that.

### 0.2 There are two Supabase projects, and one login cannot span them

| Project | Ref | Holds | Auth today |
|---|---|---|---|
| **Shared** | `yiamplfqhyurgxxbpeur` | CSRM, GIS, Image Management — **3 of 4 modules** | email on, **Google off**, signup open |
| **Skeletal** | `jlqnqzlvpljntpnbdaci` | `analyses`, `course_progress`, `course_admins` | **Google on**, email on |

A JWT issued by one Supabase project is signed with that project's secret and is
**rejected by the other**. A single sign-in therefore cannot authorise all four
modules while the data lives in two projects. This must be resolved first — it
is the critical path (§2).

---

## 1. Prerequisite: this is a four-owner decision

This plan changes the security posture of **every** module, not just Skeletal
Analysis. After it lands:

- the CSRM specimen form will require a login (it does not today);
- the GIS "add site" flow will require a login;
- image upload will require a login;
- the Skeletal Analysis wizard will require a login (it runs anonymously today);
- any demo or screenshot workflow that relied on anonymous access breaks.

**Do not start Phase 3 without the other three module owners agreeing**, and
without a shared cutover date. Technically the work is routine; socially it is
the part most likely to go wrong.

---

## 2. Architecture decision: consolidate onto one project

### Options

| Option | How | Verdict |
|---|---|---|
| **A. Consolidate into the shared project** | Move `analyses`, `course_progress`, `course_admins` into `yiamplfqhyurgxxbpeur`; retire the Skeletal project; re-configure Google there | ✅ **Recommended** |
| B. Consolidate into the Skeletal project | Move CSRM + GIS + Images the other way | ❌ Far more data (specimens, measurements, sites, images, storage objects) and it is other people's data |
| C. Two projects, two logins | Sign in twice | ❌ Unacceptable UX; roles would diverge |
| D. Share a JWT secret between projects | Make tokens from one valid on the other | ❌ Fragile, undocumented for this use, and Supabase is moving to per-project asymmetric signing keys |
| E. Backend-for-frontend | Node/Edge API holding service keys, enforcing roles | ❌ Correct for production, disproportionate here — and RLS already gives you this |

### Why A

Three of four modules and the overwhelming majority of the data already live in
the shared project. Moving Skeletal Analysis is the smaller migration: three
tables, one of which (`analyses`) is small, plus re-pointing one client file.

### What Option A costs

| Item | Work |
|---|---|
| Move 3 tables + their RLS | SQL dump/restore, ~half a day |
| Re-point `src/lib/skeletalSupabase.js` | One file; can keep the module's own client object, just aimed at the shared project |
| Enable Google on the shared project | Dashboard + a new redirect URI on the Google OAuth client |
| Re-issue `course_progress` rows | Keyed by `auth.users.id`, which **changes** on migration — see §8 risk R4 |
| Retire `course_admins` | Superseded by the `admin` role (§4) |

---

## 3. Target access model

### Roles

`public` (not signed in) · `student` · `researcher` · `admin`

### Permission matrix

| Capability | Public | Student | Researcher | Admin |
|---|:--:|:--:|:--:|:--:|
| Information site, about, contact | ✅ | ✅ | ✅ | ✅ |
| Log in | ✅ | — | — | — |
| See that the four modules exist | ❌ | ✅ | ✅ | ✅ |
| **CSRM** — browse specimens, measurements, detail | ❌ | ✅ | ✅ | ✅ |
| **CSRM** — create / edit / delete records | ❌ | ❌ | ✅ | ✅ |
| **CSRM** — import, data-quality tools | ❌ | ❌ | ✅ | ✅ |
| **GIS** — view map, sites, clustering | ❌ | ✅ | ✅ | ✅ |
| **GIS** — add / edit sites | ❌ | ❌ | ✅ | ✅ |
| **Images** — view, search, skeleton viewer | ❌ | ✅ | ✅ | ✅ |
| **Images** — upload / annotate / delete | ❌ | ❌ ⚠️ | ✅ | ✅ |
| **Skeletal** — run analysis, save case, report | ❌ | ✅ | ✅ | ✅ |
| **Skeletal** — Knowledge Base & Learning Path | ❌ | ✅ | ✅ | ✅ |
| **Skeletal** — learner-progress dashboard | ❌ | ❌ | ❌ ⚠️ | ✅ |
| **Admin** — invite users, set roles, suspend | ❌ | ❌ | ❌ | ✅ |

⚠️ = an open decision, see §9.

### Principle

Your brief specifies read-only students **for the specimen catalogue**. The
matrix above extends that consistently: *students consume reference data and
produce their own analyses; researchers and admins curate the shared record.*
Confirm or override in §9.

---

## 4. Data model

### 4.1 `profiles`

```
public.profiles
  user_id     uuid  PK → auth.users(id) on delete cascade
  email       text
  full_name   text
  role        text  not null default 'student'
                    check (role in ('admin','researcher','student'))
  status      text  not null default 'active'
                    check (status in ('active','suspended'))
  institution text                       -- optional, useful for a research system
  created_at  timestamptz not null default now()
  created_by  uuid                       -- which admin added them
  updated_at  timestamptz
```

A trigger on `auth.users` insert creates the matching profile, so a user can
never exist without a role.

> Note: several catalogue tables (`specimens`, `skeletal_inputs`,
> `excavation_records`) **already have a `created_by` column**, currently null.
> Once identity exists these become a real attribution trail at no extra cost —
> worth defaulting to `auth.uid()`.

### 4.2 Role resolution in RLS

Two viable mechanisms:

| Mechanism | How | Trade-off |
|---|---|---|
| **Helper function** (recommended to start) | `public.is_admin()`, `public.can_write_records()` as `SECURITY DEFINER` reading `profiles` | Simple; role changes take effect **immediately**; costs a lookup per query |
| **Custom Access Token Hook** | Stamp `user_role` into the JWT; RLS reads `auth.jwt()->>'user_role'` | No table lookup, faster; but a role change or suspension only applies **after token refresh** (up to 1 h) |

Start with the helper function; revisit only if profiling shows a problem.

Two non-obvious requirements:

- **`SECURITY DEFINER` is mandatory**, otherwise a policy on `profiles` that
  calls a function which reads `profiles` recurses. (The same pattern is
  already used by `is_course_admin()` in `kgc_admin_setup.sql`.)
- **Wrap calls as `(select public.is_admin())`** inside policies. Postgres then
  evaluates it once as an InitPlan instead of once per row — a documented and
  substantial RLS performance difference on large tables.

---

## 5. Database lockdown (the actual security work)

### 5.1 The trap that will silently defeat this

PostgreSQL **OR-combines permissive policies**. Adding a strict
`authenticated`-only policy while an old `TO anon USING (true)` policy still
exists changes *nothing* — the anon policy keeps granting access.

Every phase-3 migration must therefore **`DROP POLICY` the existing anon
policies first**, then create the new ones. `anon_rls_policies.sql` alone
creates ~20 such policies that must be removed.

Belt and braces, after policies are replaced:

```
revoke all on all tables in schema public from anon;
```

### 5.2 Policy shape per table class

| Table class | Tables | SELECT | INSERT / UPDATE / DELETE |
|---|---|---|---|
| **Curated records** | `specimens`, `measurements`, `skeletal_inputs`, `excavation_records`, `laboratory_dating_results`, `sites`, `bone_images` | `to authenticated using (true)` | `with check ((select public.can_write_records()))` |
| **User-generated analyses** | `analyses` | `to authenticated using (true)` | `to authenticated with check (true)` — students may create |
| **Per-learner** | `course_progress` | own row, **or** `(select public.is_admin())` | own row only |
| **Identity** | `profiles` | own row, or admin | admin only (except own `full_name`) |
| **Reference** | `bone_type_reference`, lookups | `to authenticated using (true)` | admin only |

### 5.3 Storage

The Image Management module uses Supabase Storage. `storage.objects` has its
**own** RLS, entirely separate from table policies — locking tables down does
nothing for image files. Bucket listing returned empty to the anon key, so the
current bucket configuration must be inspected directly in the dashboard and
given equivalent policies (read: authenticated; write: `can_write_records()`).

**Do not skip this.** It is the most commonly forgotten half of a Supabase
lockdown.

### 5.4 Close public signup

`disable_signup` is currently **false** on the shared project with the email
provider enabled — anyone can self-register today. Since users are to be
created by an admin, set **Disable signup = true**. Otherwise the entire role
model is bypassable by clicking "sign up".

---

## 6. Frontend

### 6.1 Route structure

```
PUBLIC
  /                     Information site (new)  — project, team, research, contact
  /login                Sign in
  /reset-password       If email/password is enabled

AUTHENTICATED (any role)
  /app                  Module launcher (today's HomePage, gated)
  /skeletal/**          Skeletal Analysis
  /specimens            Browse catalogue        (read)
  /specimens/:id        Specimen detail         (read)
  /parami/**            GIS
  /gallery, /image/:id, /skeleton   Images      (read)

RESEARCHER + ADMIN
  /specimens/add, /specimens/import, /data-quality
  /parami/add-site, /parami/add-specimen
  /upload

ADMIN ONLY
  /admin/users          User management (new)
  /skeletal/admin/learners   Learner progress (exists)
```

### 6.2 Components to build

| Component | Purpose |
|---|---|
| `PublicLandingPage` | The information site visitors see |
| `LoginPage` | Google and/or email sign-in, error states |
| `RequireAuth` | Redirects to `/login`, preserving intended destination |
| `RequireRole roles={[...]}` | 403 screen for insufficient role |
| `AuthContext` (rework) | Expose `{ user, profile, role, loading }` — currently ASA-only and pointed at the Skeletal project |
| `useRole()` / `<Can do="write">` | Declarative show/hide for buttons |
| `AdminUsersPage` | Invite, list, change role, suspend |
| Nav rework | `App.jsx` currently renders Bone Records / Image Search / Skeleton Viewer links unconditionally |

### 6.3 Reusing what exists

`src/context/AuthContext.jsx` was reworked this week — session handling, the
loading-state fix, `redirectTo` defaulting to the current path, and the
account chooser are all already in place. It needs re-pointing at the
consolidated project and extending with `profile` / `role`; it does not need
rewriting.

`RequireRole` should also **replace** the bespoke `course_admins` check added
for the learner dashboard, so there is exactly one notion of "admin".

---

## 7. Admin-managed user provisioning

Creating users requires the **`service_role`** key, which must **never** reach
the browser. Three ways to do it:

| Option | Mechanism | Verdict |
|---|---|---|
| **A. Invite by email** | Supabase **Edge Function** holding `service_role` as a secret, calling `auth.admin.inviteUserByEmail()`; caller verified as admin inside the function | ✅ Recommended — user sets their own password, nothing is transmitted insecurely |
| **B. Admin sets a temporary password** | Same Edge Function, `auth.admin.createUser()` | Good fallback if SMTP is not configured — no email deliverability dependency, useful for a demo |
| **C. Self-signup + admin approval** | Keep signup open, new users default to `status='pending'` | ❌ Contradicts "admin registers users"; anyone can create an account |

Recommend **A**, with **B** available for the demo, since Supabase's default
email sending is rate-limited and often unreliable for a project deployment.

The Edge Function must re-verify the caller's admin role **server-side** from
their JWT. Trusting a role sent from the client is the classic hole here.

### Bootstrapping the first admin

Chicken-and-egg: the first admin must be created by hand in the SQL editor,
**before** signup is disabled and before the admin UI exists. Same pattern as
`kgc_admin_setup.sql` §6.

---

## 8. Phasing, and the risk register

| Phase | Work | Days | Can it break others? |
|---|---|---|---|
| **0** | Decisions (§9) + agreement from all module owners | 1 | — |
| **1** | Consolidate Skeletal tables into the shared project; re-point the client; move Google config | 1–2 | Skeletal only |
| **2** | `profiles`, role helper functions, `auth.users` trigger, seed first admin | 1 | No — additive |
| **3** | **RLS lockdown**, table by table + storage; drop anon policies; disable signup | 2–3 | **Yes — everything** |
| **4** | Public site, login, `RequireAuth` / `RequireRole`, nav rework | 2 | Frontend only |
| **5** | Admin user management (Edge Function + UI) | 1–2 | No |
| **6** | Role-aware UI: hide write actions from students | 1 | No |
| **7** | Access-matrix testing (§10) + cutover | 1 | — |

Phases 1–2 are safe and reversible. **Phase 3 is the cutover** — everything
before it is preparation, everything after it is polish.

### Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | Anon policies left in place → lockdown silently does nothing | Explicitly `DROP POLICY`; verify with a raw anon-key `curl` returning 0 rows / 401 |
| R2 | Storage left open while tables are locked | Treat `storage.objects` as a first-class item in Phase 3 |
| R3 | Locked out — no admin exists after signup is disabled | Seed the first admin in Phase 2, verify sign-in, *then* disable signup |
| R4 | **`course_progress` orphaned by migration** — it is keyed by `auth.users.id`, and migrating users to another project issues **new** ids | Migrate by *email*, remapping ids; or accept a progress reset and say so |
| R5 | `service_role` key leaks into the bundle | Only ever inside an Edge Function secret; add a CI grep for the key prefix |
| R6 | RLS infinite recursion on `profiles` | `SECURITY DEFINER` helpers (proven pattern already in the repo) |
| R7 | Other modules break at cutover without warning | Phase 0 agreement + a shared cutover date |
| R8 | **Keys already public** — `.env.local` is committed to git and the Skeletal anon key is hardcoded in `skeletalSupabase.js` | Rotate both anon keys as part of Phase 3; the old ones are in git history forever |
| R9 | Slow queries once every read passes through a role function | Use the `(select …)` InitPlan wrapper; index `profiles(user_id)` |
| R10 | Two competing admin notions (`course_admins` vs `role='admin'`) | Retire `course_admins` in Phase 2 |

---

## 9. Open decisions — needed before Phase 0 closes

| # | Question | Recommended default |
|---|---|---|
| D1 | Consolidate onto the shared project? | **Yes** (§2 Option A) |
| D2 | May students **add GIS sites**? | No — read-only, mirroring CSRM |
| D3 | May students **upload images**? | No — read-only ⚠️ but this may be too strict if image work is a student exercise |
| D4 | May researchers see the **learner-progress dashboard**? | No — admin only; it contains other people's progress |
| D5 | Sign-in method | Google **and** email/password — Google alone excludes anyone without a Google account; email/password alone loses the working Google flow |
| D6 | Invite by email, or admin-set password? | Invite, with admin-set as the demo fallback |
| D7 | May students **delete their own** saved analyses? | Yes — own rows only |
| D8 | What is on the public information site? | Project overview, team, methodology, publications, contact — content task, not engineering |
| D9 | Do researchers self-register and get approved, or are they always invited? | Always invited (your brief says admin registers them) |

---

## 10. Testing — prove it at the API, not in the UI

A UI walkthrough **cannot** demonstrate that access control works, because the
UI is not what enforces it. The acceptance test must hit PostgREST directly.

**Access matrix harness.** Obtain a real JWT for one user of each role, then for
every (role × table × operation) assert allowed or denied:

```
for role in anon student researcher admin:
  for table in specimens measurements skeletal_inputs sites analyses profiles …:
    assert SELECT / INSERT / UPDATE / DELETE match the §3 matrix
```

**Non-negotiable negative tests**

1. Raw **anon key** against every table → `401` or zero rows.
2. **Student** JWT attempting `INSERT` into `specimens` → denied by the database.
3. Student navigating **directly** to `/specimens/add` → blocked, and the write
   fails server-side even if the guard is bypassed.
4. **Suspended** user's existing token → denied.
5. Non-admin calling the invite **Edge Function** → `403`.
6. Storage: anon fetching a known object URL → denied.

Test 2 is the one that matters most: it is the difference between a hidden
button and an enforced rule.

---

## 11. What is *not* in this plan

- Per-record ownership ("researcher A may edit only their own specimens") — the
  model here is role-based, not record-based. `created_by` would support it
  later.
- Audit logging of who changed what.
- Password policy, MFA, session timeout tuning.
- Rate limiting.
- Email templates and SMTP configuration.
- The written content of the public information site.

---

*OAHRIS · R26-ISE-006 · Plan prepared by the Automated Skeletal Analysis System
module (Chamudi Gayeshika, IT22299802) · 22 August 2026 · **not implemented***
