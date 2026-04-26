# ⚙️ StockBill — Setup Guide

This guide walks you from a fresh clone to a fully working app with an admin
account and an active owner account.

---

## 1. Prerequisites

- Node.js 18+ (or Bun)
- npm / pnpm / bun

> You do **not** need a Supabase account. Lovable Cloud handles the backend.

---

## 2. Install & run

```bash
npm install
npm run dev
```

The app starts at <http://localhost:5173>. The backend is already provisioned
and connected — no `.env` editing needed.

### Environment variables

A `.env` is auto-generated and managed by Lovable Cloud. It contains:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

**Do not edit these manually.** They're refreshed automatically.

---

## 3. Bootstrap the first admin (one-time)

A fresh database has zero admins. Promote your account in two steps:

### Step 1 — Sign up
1. Open the app → click **Sign up**
2. Enter the email you want as admin + a strong password
3. You'll land on `/pending` (account is inactive — that's expected)

### Step 2 — Promote to admin
Open **Lovable Cloud → Database → SQL Editor** and run:

```sql
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE');
```

Then sign out and sign in again at **`/admin/login`**. You'll be taken to the
admin console.

---

## 4. Activate an owner account

1. Have someone (or a second test account) sign up at `/auth`
2. As admin at `/admin`, find them in the table
3. Click **Activate**
4. They sign in at `/auth` and reach the dashboard

---

## 5. Auth settings (recommended before launch)

Email confirmation is currently **disabled** for fast iteration. Before going
live:

**Cloud → Users → Auth settings → Email**
- ✅ Re-enable **Confirm email**
- ✅ Keep **Password HIBP Check** on (already enabled)

**Cloud → Users → Auth settings → URL Configuration**
- Set **Site URL** to your production domain
- Add your domain to **Redirect URLs**

---

## 6. Storage

Two private buckets exist:

| Bucket | Purpose | Path pattern |
|--------|---------|--------------|
| `logos` | Business logos | `{owner_id}/logo.png` |
| `signatures` | Signature images | `{owner_id}/signature.png` |

Owners can read/write only their own folder. Admins have full access.
Both buckets are private — files must be served via signed URLs.

---

## 7. Tour of the routes

| Route | Who | Purpose |
|------|-----|---------|
| `/auth` | Public | Owner sign-up / sign-in |
| `/admin/login` | Public | Admin-only sign-in |
| `/pending` | Authed inactive owner | Activation pending screen |
| `/admin` | Admin | Owner management |
| `/` | Active owner | Dashboard |
| `/products` | Active owner | Product CRUD *(Phase 3)* |
| `/invoices` | Active owner | Invoice list *(Phase 4)* |
| `/invoices/new` | Active owner | Create invoice *(Phase 4)* |
| `/settings` | Active owner | Business profile |

---

## 8. Common tasks

### Demote an admin back to owner
```sql
UPDATE public.user_roles
SET role = 'owner'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'EMAIL');
```

### Force-activate a single owner via SQL
```sql
UPDATE public.owners
SET is_active = true
WHERE email = 'EMAIL';
```

### Reset a user's password (admin)
Use **Cloud → Users → Auth → "..." menu → Send password recovery**.

### Delete a user completely
**Cloud → Users → Auth → "..." menu → Delete user**. Cascades remove their
owner row, products, invoices, and items automatically.

---

## 9. Troubleshooting

### "I signed up but the dashboard says pending"
✅ Working as designed. An admin must activate you. See section 4.

### "I'm an admin but I see the owner dashboard"
You're hitting the wrong login. Sign out, then sign in at **`/admin/login`**.
The role is loaded fresh on each sign-in.

### "Permission denied for table X"
RLS is doing its job. Make sure:
- You're signed in
- Your owner account is **active**
- Records you're querying belong to you (`owner_id = auth.uid()`)

### "Storage upload fails"
The file path **must** start with the user's UUID:
```ts
const path = `${user.id}/signature.png`;
```
Otherwise the bucket policy denies the write.

### Build errors after editing the database schema
The Supabase TypeScript types are auto-regenerated on each migration. Rebuild
once with `npm run dev` to refresh.

---

## 10. Production checklist

Before launch:

- [ ] Re-enable email confirmation (section 5)
- [ ] Set Site URL + Redirect URLs to production domain
- [ ] Promote real admin accounts; remove test accounts
- [ ] Verify `is_active = false` is the default for new signups (it is)
- [ ] Run the security linter (Cloud → Security)
- [ ] Test owner flow on mobile viewports
- [ ] Set up a custom domain (Project Settings → Domains)

---

That's it — you're set up. See [README.md](./README.md) for feature overview
and roadmap.
