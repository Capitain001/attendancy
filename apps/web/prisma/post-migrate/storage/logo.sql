-- ============================================================
-- Storage: bucket "logos"
-- Idempotent — rejouable après chaque migrate/reset
-- ============================================================

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Lecture publique
drop policy if exists "logos_public_read" on storage.objects;
create policy "logos_public_read"
on storage.objects for select
to public
using (bucket_id = 'logos');

-- Upload : uniquement par un responsable de l'organisation ciblée
drop policy if exists "logos_responsable_insert" on storage.objects;
create policy "logos_responsable_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'logos'
  and exists (
    select 1 from "UserOrganization" uo
    where uo."userId" = auth.uid()
      and uo."orgId" = (storage.foldername(name))[2]::uuid
      and uo."isResponsable" = true
  )
);

-- Update : idem
drop policy if exists "logos_responsable_update" on storage.objects;
create policy "logos_responsable_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'logos'
  and exists (
    select 1 from "UserOrganization" uo
    where uo."userId" = auth.uid()
      and uo."orgId" = (storage.foldername(name))[2]::uuid
      and uo."isResponsable" = true
  )
);

-- Delete : idem
drop policy if exists "logos_responsable_delete" on storage.objects;
create policy "logos_responsable_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'logos'
  and exists (
    select 1 from "UserOrganization" uo
    where uo."userId" = auth.uid()
      and uo."orgId" = (storage.foldername(name))[2]::uuid
      and uo."isResponsable" = true
  )
);