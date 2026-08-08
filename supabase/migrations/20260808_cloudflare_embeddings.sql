-- ============================================================================
-- Cloudflare Workers AI embeddings (bge-m3, 1024-dim)
-- ============================================================================
-- Adds a parallel embedding column so the MCP can run vector search on
-- Cloudflare Workers AI instead of OpenAI. bge-m3 produces 1024-dim vectors,
-- so it cannot reuse the existing vector(1536) `embedding` column — this adds
-- `embedding_cf vector(1024)` alongside it, with its own HNSW index and a
-- search RPC that mirrors search_content().
--
-- Safe to run on the live database: only additive DDL, no drops. The existing
-- OpenAI column and RPC are untouched, so nothing breaks if the switch is
-- deferred or rolled back.
--
-- Run once in the Supabase SQL editor (or via psql). Then the MCP backfills
-- embedding_cf through the worker and flips VECTOR_SEARCH_PROVIDER=cloudflare.
-- ============================================================================

-- pgvector is already enabled (the 1536-dim column exists), but be safe.
create extension if not exists vector;

alter table content_entries add column if not exists embedding_cf vector(1024);
alter table content_chunks  add column if not exists embedding_cf vector(1024);

create index if not exists idx_entries_embedding_cf_hnsw
  on content_entries using hnsw (embedding_cf vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index if not exists idx_chunks_embedding_cf_hnsw
  on content_chunks using hnsw (embedding_cf vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Entry search on the Cloudflare column. Same shape and return columns as
-- search_content(), reading category/tags/confidence/system from either the
-- dedicated columns or the metadata JSONB (the corpus holds both shapes).
create or replace function search_content_cf(
    query_embedding vector(1024),
    query_text text default null,
    match_threshold float default 0.15,
    match_count int default 10,
    filter_category text default null,
    filter_tags text[] default null
)
returns table (
    id text,
    title text,
    content text,
    source_type text,
    source_location text,
    metadata jsonb,
    ingested_at timestamptz,
    updated_at timestamptz,
    category text,
    tags jsonb,
    confidence text,
    system_name text,
    rank float
)
language plpgsql
stable
as $$
begin
    return query
    select
        e.id,
        e.title,
        e.content,
        e.source_type,
        e.source_location,
        e.metadata,
        e.ingested_at,
        e.updated_at,
        coalesce(e.category, e.metadata->>'category') as category,
        coalesce(to_jsonb(e.tags), e.metadata->'tags') as tags,
        coalesce(e.confidence, e.metadata->>'confidence') as confidence,
        coalesce(e.system_name, e.metadata->>'system') as system_name,
        1 - (e.embedding_cf <=> query_embedding) as rank
    from content_entries e
    where
        e.embedding_cf is not null
        and (filter_category is null
             or e.category = filter_category
             or e.metadata->>'category' = filter_category)
        and (filter_tags is null
             or to_jsonb(e.tags) ?| filter_tags
             or e.metadata->'tags' ?| filter_tags)
        and (1 - (e.embedding_cf <=> query_embedding)) >= match_threshold
    order by e.embedding_cf <=> query_embedding
    limit match_count;
end;
$$;

-- Chunk search on the Cloudflare column, mirroring search_chunks().
create or replace function search_chunks_cf(
    query_embedding vector(1024),
    match_threshold float default 0.15,
    match_count int default 20
)
returns table (
    id integer,
    entry_id text,
    chunk_text text,
    chunk_index integer,
    metadata jsonb,
    similarity float
)
language plpgsql
stable
as $$
begin
    return query
    select
        c.id,
        c.entry_id,
        c.chunk_text,
        c.chunk_index,
        c.metadata,
        1 - (c.embedding_cf <=> query_embedding) as similarity
    from content_chunks c
    where
        c.embedding_cf is not null
        and (1 - (c.embedding_cf <=> query_embedding)) >= match_threshold
    order by c.embedding_cf <=> query_embedding
    limit match_count;
end;
$$;
