# Access Control — Runbook

> How to take this branch from "code merged" to "four modules actually locked
> down". Implements [ACCESS_CONTROL_PLAN.md](../ACCESS_CONTROL_PLAN.md).

| | |
|---|---|
| **Code status** | ✅ Implemented and building |
| **Database status** | ⏳ **Not applied — you must run the SQL below** |
| **Backup** | tags `backup/pre-access-control-main` and `backup/pre-access-control-chamudi`, branch `backup-pre-access-control` |

---

## 0. The one thing to understand first

**Nothing is secured until you run the SQL.** Merging this branch changes what
the interface shows; it does not change what the database allows. The Supabase
anon key is inside the JavaScript bundle, so anyone can query the REST API
directly and never run the React code at all.

Until `02_rls_lockdown.sql` runs, every record remains world-readable and
world-writable exactly as it is today.

---

## 1. Order of operations

Steps marked **M** are manual dashboard actions I cannot perform for you;
steps marked **S** are SQL scripts in this folder.

| # | Step | Where | Reversible? |
|---|---|---|---|
| **M1** | Create your own account (sign up once, or Authentication → Users → Add user) | Dashboard, shared project | yes |
| **S1** | Run [`01_identity_and_roles.sql`](01_identity_and_roles.sql) — **edit the e-mail in section 7 first** | SQL Editor | yes |
| **M2** | Confirm the verification query returned *your* account with `role = admin` | SQL Editor | — |
| **M3** | Authentication → Providers → **Disable public sign-up**. Enable Email; enable Google if you want it | Dashboard | yes |
| **M4** | Authentication → URL Configuration → add every origin to Redirect URLs (`http://localhost:5173/**`, `https://<app>.vercel.app/**`) | Dashboard | yes |
| **M5** | Deploy the admin Edge Function (§3) | Terminal | yes |
| **S2** | Run [`03_consolidate_skeletal.sql`](03_consolidate_skeletal.sql) and move the data (§4) | SQL Editor | yes |
| **M6** | Set `VITE_SKELETAL_CONSOLIDATED=true` and redeploy | `.env.local` | yes |
| **S3** | 🚨 Run [`02_rls_lockdown.sql`](02_rls_lockdown.sql) — **this is the cutover** | SQL Editor | see §6 |
| **M7** | Storage → `bone-images` bucket → set **not public** | Dashboard | yes |
| **S4** | Run the access-matrix test (§5) and read the output | Terminal | — |
| **M8** | Rotate both anon keys (they are in git history) | Dashboard | — |

**Do not run S3 without the other three module owners' agreement.** After it,
the specimen form, GIS site creation, image upload and the skeletal wizard all
require a login. See ACCESS_CONTROL_PLAN.md §1.

---

## 2. What the code does before you run any SQL

Merging this branch is safe on its own:

- `/` becomes the public information site; the module launcher moves to `/app`.
- `/login` appears; there is no sign-up form.
- Every module route is wrapped in a guard, so an unauthenticated visitor is
  redirected to `/login`.
- Navigation hides links the current role cannot use.
- **Data access is unchanged** — still governed by whatever policies exist today.

If `profiles` does not exist yet, a signed-in user sees a "No role assigned"
screen naming the script to run, rather than a blank page.

---

## 3. Deploying the admin Edge Function (M5)

Creating accounts needs the `service_role` key, which must never reach a
browser. It lives as a function secret instead.

```bash
npm install -g supabase          # if not installed
supabase login
supabase link --project-ref yiamplfqhyurgxxbpeur

# Settings → API → service_role key (secret)
supabase secrets set SERVICE_ROLE_KEY=<service_role key>

supabase functions deploy admin-users
```

The function re-verifies from the caller's JWT that they are an active admin
before creating anything — a student calling it directly gets a 403.

**Without this step** the Users screen can still change roles and suspend
accounts; only *creating* users fails, with a message saying so. You can add
users from the dashboard in the meantime.

---

## 4. Consolidating the Skeletal module (S2, M6)

The project has two Supabase databases. A JWT is signed by one project and
rejected by the other, so one login cannot secure all four modules until the
skeletal tables sit with the rest.

`03_consolidate_skeletal.sql` creates `analyses` and `course_progress` on the
shared project, already policied. Moving the **data** is manual because it
crosses two databases — section 4 of that script has the steps.

⚠️ **`course_progress` cannot be copied verbatim.** It is keyed by
`auth.users.id`, and users re-created on the shared project get new ids. Either
remap by e-mail or accept a progress reset. The script explains both; for the
handful of current learners, accepting the reset is the honest choice.

Until `VITE_SKELETAL_CONSOLIDATED=true`, the skeletal module keeps using its old
project. Login and the other three modules work normally, but Learning Path
progress will not save, because the signed-in user does not exist in that
project. The console says so rather than failing silently.

---

## 5. Testing (S4)

A click-through **cannot** prove access control works, because the UI is not
what enforces it. Test at the API.

```bash
node access_control/access_matrix_test.mjs
```

It needs credentials for one account per role, via environment variables — see
the file header. It asserts, for every role × table × operation, that the
result matches the permission matrix, and includes the tests that matter most:

1. The raw anon key returns nothing from any table.
2. A **student's** `INSERT` into `specimens` is refused **by the database**.
3. A suspended account is refused everywhere.

Test 2 is the difference between a hidden button and an enforced rule.

---

## 6. Rolling back

**Code:** `git checkout backup-pre-access-control`, or reset to
`backup/pre-access-control-main`.

**Database:** the lockdown is the only hard-to-reverse step, because it drops
the old anon policies and they are not restorable automatically. If you must
reopen access, re-run the original policy scripts (`anon_rls_policies.sql`,
`kgc_supabase_setup.sql`) and re-grant:

```sql
grant all on all tables in schema public to anon;
```

`01_identity_and_roles.sql` and `03_consolidate_skeletal.sql` are additive —
dropping `profiles` / the new tables reverses them cleanly.

**Take a database backup before S3.** Supabase → Database → Backups.

---

## 7. Files

| File | Purpose |
|---|---|
| `01_identity_and_roles.sql` | `profiles`, role helpers, new-user trigger, privilege-escalation guard, seed admin |
| `02_rls_lockdown.sql` | 🚨 The cutover: drops anon policies, adds role-based ones, revokes anon grants, storage policies |
| `03_consolidate_skeletal.sql` | Creates the skeletal tables on the shared project + data-move instructions |
| `access_matrix_test.mjs` | Proves the matrix at the API |
| `../supabase/functions/admin-users/index.ts` | Admin-only account creation |

---

## 8. Known gaps

Honest list of what this does **not** yet do:

- **Per-record ownership** — a researcher may edit any record, not only their
  own. `created_by` is now populated, so this is possible later.
- **Audit log** — no history of who changed what.
- **Students and image upload** — currently curator-only (decision D3 in the
  plan). If image work is a student exercise, change `/upload` to `<Auth>` in
  `App.jsx` and move `bone_images` to the analyses-style policy.
- **Write buttons inside module pages** are not hidden for students. The routes
  are guarded, so a student clicking "Add Specimen" gets a clear "not available
  to your account" screen rather than a hidden button. This was deliberate: it
  avoids editing other students' module pages. Wrapping those buttons in
  `<Can write>` (from `AuthGuards.jsx`) is a small follow-up per page.
- **`kgc_*` legacy tables** on the old skeletal project still carry open anon
  policies. They are unused by the app; drop them or lock them separately.
