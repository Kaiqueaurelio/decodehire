-- Harden Realtime, Storage, subscription, and SECURITY DEFINER exposure.

-- Realtime private channel authorization. Notification channels must be named:
-- user-notifications:<auth.uid()>
do $$
begin
  if to_regclass('realtime.messages') is not null then
    execute 'alter table realtime.messages enable row level security';

    execute 'drop policy if exists "Users can subscribe to own notification channels" on realtime.messages';
    execute $policy$
      create policy "Users can subscribe to own notification channels"
      on realtime.messages
      for select
      to authenticated
      using (realtime.topic() = ('user-notifications:' || auth.uid()::text))
    $policy$;
  end if;
end $$;

-- Receipts bucket: allow users to maintain only objects inside their own user-id folder,
-- and allow admins to maintain receipts for support/payment review.
drop policy if exists "Users can update own receipts" on storage.objects;
create policy "Users can update own receipts"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own receipts" on storage.objects;
create policy "Users can delete own receipts"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Admins can update receipts" on storage.objects;
create policy "Admins can update receipts"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'receipts'
  and exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
)
with check (
  bucket_id = 'receipts'
  and exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins can delete receipts" on storage.objects;
create policy "Admins can delete receipts"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'receipts'
  and exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
);

-- Resumes bucket: make overwrites explicit and scoped to the owning user folder.
drop policy if exists "Users can update own resumes" on storage.objects;
create policy "Users can update own resumes"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- User subscriptions must be created by trusted server code or admins, not by any user.
do $$
declare
  policy_name text;
begin
  for policy_name in
    select pol.polname
    from pg_policy pol
    join pg_class cls on cls.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'user_subscriptions'
      and pol.polcmd in ('a', '*')
  loop
    execute format('drop policy if exists %I on public.user_subscriptions', policy_name);
  end loop;
end $$;

drop policy if exists "Admins can insert subscriptions" on public.user_subscriptions;
create policy "Admins can insert subscriptions"
on public.user_subscriptions
for insert
to authenticated
with check (
  exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
);

-- Make daily usage callable without SECURITY DEFINER privileges.
create or replace function public.get_daily_usage(_user_id uuid)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)::integer
  from public.analysis_results
  where user_id = _user_id
    and created_at >= date_trunc('day', now());
$$;

grant execute on function public.get_daily_usage(uuid) to authenticated;

-- Revoke direct execution of SECURITY DEFINER functions from exposed API roles.
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
  loop
    execute format('revoke execute on function %s from anon, authenticated', fn.signature);
  end loop;
end $$;
