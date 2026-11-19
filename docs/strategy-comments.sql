-- Comments on the strategy page /strategi/2027-2030 (src/lib/strategy-comments.ts).
-- Run once in the club's Supabase project: SQL Editor › New query › paste › Run.
-- The site writes with the service-role key (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, already set for the site);
-- row level security with no policies keeps the table closed to the public keys.

create table if not exists strategy_comments (
  id uuid primary key,                       -- made by the browser; a retry with the same id stores nothing new
  doc_id text not null,                      -- 'strategi-2027-2030'
  point_id text not null,                    -- the point's id in src/lib/strategy-2027-2030.ts
  parent_id uuid references strategy_comments (id) on delete cascade,  -- null for a comment, the comment's id for a reply
  author text not null,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists strategy_comments_doc_time on strategy_comments (doc_id, created_at);

alter table strategy_comments enable row level security;
