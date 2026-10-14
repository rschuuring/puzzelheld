-- Puzzelheld: opslag van de voortgang. Plak dit in Supabase > SQL Editor > New query en klik Run.
-- Eén rij per ouder-account. Row Level Security zorgt dat elk account alleen zijn eigen rij ziet.
create table if not exists public.puzzelheld_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.puzzelheld_state enable row level security;

drop policy if exists "eigen rij lezen" on public.puzzelheld_state;
drop policy if exists "eigen rij maken" on public.puzzelheld_state;
drop policy if exists "eigen rij wijzigen" on public.puzzelheld_state;
drop policy if exists "eigen rij wissen" on public.puzzelheld_state;

create policy "eigen rij lezen" on public.puzzelheld_state
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "eigen rij maken" on public.puzzelheld_state
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "eigen rij wijzigen" on public.puzzelheld_state
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "eigen rij wissen" on public.puzzelheld_state
  for delete to authenticated using ((select auth.uid()) = user_id);
