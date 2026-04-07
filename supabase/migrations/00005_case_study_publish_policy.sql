drop policy if exists "Doctors publish case studies" on public.knowledge_base;
create policy "Doctors publish case studies"
  on public.knowledge_base
  for insert
  with check (
    metadata->>'content_type' = 'case_study'
    and metadata->>'author_id' = auth.uid()::text
  );

drop policy if exists "Doctors update own case studies" on public.knowledge_base;
create policy "Doctors update own case studies"
  on public.knowledge_base
  for update
  using (
    metadata->>'content_type' = 'case_study'
    and metadata->>'author_id' = auth.uid()::text
  )
  with check (
    metadata->>'content_type' = 'case_study'
    and metadata->>'author_id' = auth.uid()::text
  );
