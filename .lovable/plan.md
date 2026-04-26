
The user wants a comprehensive UI/UX overhaul of the auth/login page with a rebrand to "Invelix". Let me check a few things first to plan accurately.

Key observations from the existing code:
- `src/pages/Auth.tsx` handles both signin AND signup in one page (toggle mode)
- Uses StockBill brand + Package icon + gradient-auth background
- Already has react-hook-form + Zod validation
- Uses shadcn Input/Card/Button components
- Has `/admin/login` link at bottom
- The user wants this to feel like a "sign-in" focused page but signup mode also exists

Scope decisions:
- Apply branding (Invelix + new logo) globally where StockBill appears (sidebar, auth, admin login) for consistency — but keep this plan focused on the Auth page primarily; mention sidebar/admin updates as part of brand sweep
- Add new features: show/hide password, remember me, forgot password link, first-time user redirect to settings
- Forgot password: implement a simple "send reset email" flow using `supabase.auth.resetPasswordForEmail` + a new `/reset-password` route to handle the recovery
- Remember me: Supabase persists sessions by default; implement as visual + use localStorage flag (purely UX since Supabase already persists). Will note this honestly.
- First-time user check: after signin, query `owners` table for current user — if no row, toast + redirect to `/settings` with a banner

Color palette change:
- Primary: #4F46E5 indigo, Accent: #22C55E green
- Need to update CSS variables in `src/index.css` for `--primary` and add accent token
- Update `gradient-auth` to soft gray→indigo

Files to change:
1. `src/index.css` — primary color → indigo, accent → green, gradient-auth refresh
2. `src/pages/Auth.tsx` — full rewrite per spec (Invelix branding, new copy, password toggle, remember me, forgot password link, first-time user redirect)
3. `src/pages/AdminLogin.tsx` — rebrand StockBill → Invelix (small)
4. `src/components/AppSidebar.tsx` — rebrand StockBill → Invelix (small)
5. `src/pages/ResetPassword.tsx` — NEW: handles password reset flow (set new password after clicking email link)
6. `src/App.tsx` — add `/reset-password` route
7. New `Invelix` logo component (inline SVG: stylized "I" inside a box with checkmark accent) — keep inline in Auth/Sidebar for simplicity, or create `src/components/BrandLogo.tsx`

The "بسهولة" Arabic word in subheading is intentional per spec — will keep it as-is.

Plan is clear. Concise plan below.
