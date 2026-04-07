drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can view all patients" on public.patients;
drop policy if exists "Admins view all appointments" on public.appointments;
drop policy if exists "Only admins edit knowledge base" on public.knowledge_base;
drop policy if exists "Only admins view metrics" on public.platform_metrics;

alter table public.profiles
  drop constraint if exists profiles_role_check;

do $$
begin
  begin
    alter table public.profiles
      alter column role type public.user_role
      using role::text::public.user_role;
  exception
    when duplicate_object or datatype_mismatch or undefined_function then
      null;
    when others then
      if sqlerrm not like '%cannot alter type%' then
        raise;
      end if;
  end;
end $$;

create policy "Admins can view all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can view all patients"
  on public.patients for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins view all appointments"
  on public.appointments for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Only admins edit knowledge base"
  on public.knowledge_base for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Only admins view metrics"
  on public.platform_metrics for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
