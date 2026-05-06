-- Agrega metadata de origen (usuario/rol) a sugerencias_dev
-- para poder distinguir sugerencias de vendedores/admin en el panel.

alter table if exists sugerencias_dev
  add column if not exists user_id uuid references users(id) on delete set null;

alter table if exists sugerencias_dev
  add column if not exists rol text;

create index if not exists idx_sugerencias_dev_user_created
  on sugerencias_dev(user_id, created_at desc);

