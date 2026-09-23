-- Mijote accounts: one encrypted vault per user.
-- The server never sees readable data: `data` is encrypted on the device (AES-GCM) with a data key,
-- and that key is stored wrapped by a key derived from the user's password (never sent).
-- Run it once in Supabase → SQL Editor (or `supabase db push`).

create table if not exists public.vaults (
  user_id uuid primary key references auth.users (id) on delete cascade,
  wrapped_key text not null,
  wrap_iv text not null,
  data text not null check (length(data) < 5000000),
  data_iv text not null,
  updated_at timestamptz not null default now()
);

alter table public.vaults enable row level security;

-- Each user can only read and write their own vault.
create policy "Own vault: read" on public.vaults for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own vault: create" on public.vaults for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Own vault: update" on public.vaults for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own vault: delete" on public.vaults for delete to authenticated using ((select auth.uid()) = user_id);
