create extension if not exists vector with schema extensions;

create type public.app_role as enum ('user', 'admin');
create type public.doc_status as enum ('UPLOADING','EXTRACTING','CHUNKING','EMBEDDING','INDEXING','PROCESSING','COMPLETED','FAILED');

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_select_admin" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();

create policy "user_roles_select_own" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "user_roles_select_admin" on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- signup trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',''), coalesce(new.email,''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict (user_id, role) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- documents
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  file_size bigint not null default 0,
  page_count int,
  chunk_count int,
  status public.doc_status not null default 'UPLOADING',
  processing_progress int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.documents to authenticated;
grant all on public.documents to service_role;
alter table public.documents enable row level security;
create policy "documents_own_all" on public.documents for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "documents_select_admin" on public.documents for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "documents_delete_admin" on public.documents for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create index documents_user_idx on public.documents(user_id, created_at desc);
create trigger documents_updated_at before update on public.documents for each row execute function public.update_updated_at_column();

-- chunks
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  chunk_index int not null,
  page_number int,
  content text not null,
  embedding extensions.vector(768),
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.document_chunks to authenticated;
grant all on public.document_chunks to service_role;
alter table public.document_chunks enable row level security;
create policy "chunks_own_all" on public.document_chunks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index chunks_doc_idx on public.document_chunks(document_id, chunk_index);

create or replace function public.match_document_chunks(
  _document_id uuid, _query extensions.vector(768), _match_count int default 6
) returns table (id uuid, content text, page_number int, similarity float)
language sql stable security definer set search_path = public, extensions as $$
  select c.id, c.content, c.page_number, 1 - (c.embedding <=> _query) as similarity
  from public.document_chunks c
  join public.documents d on d.id = c.document_id
  where c.document_id = _document_id
    and c.embedding is not null
    and (d.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  order by c.embedding <=> _query
  limit greatest(1, least(_match_count, 20));
$$;

-- chat
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.chat_sessions to authenticated;
grant all on public.chat_sessions to service_role;
alter table public.chat_sessions enable row level security;
create policy "sessions_own_all" on public.chat_sessions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sessions_select_admin" on public.chat_sessions for select to authenticated using (public.has_role(auth.uid(),'admin'));
create index sessions_user_idx on public.chat_sessions(user_id, updated_at desc);
create trigger chat_sessions_updated_at before update on public.chat_sessions for each row execute function public.update_updated_at_column();

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('USER','ASSISTANT')),
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.chat_messages to authenticated;
grant all on public.chat_messages to service_role;
alter table public.chat_messages enable row level security;
create policy "messages_own_all" on public.chat_messages for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "messages_select_admin" on public.chat_messages for select to authenticated using (public.has_role(auth.uid(),'admin'));
create index messages_session_idx on public.chat_messages(session_id, created_at);