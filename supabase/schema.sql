-- Vocab Box — cross-device sync backend
--
-- Paste this whole file into the Supabase SQL editor and run it. It is
-- re-runnable: tables are created only if missing, functions are replaced.
--
-- The design keeps the table completely unreachable from the API. Row level
-- security is on with no policies, every direct grant is revoked, and the only
-- way in is the two SECURITY DEFINER functions below, which run as the table
-- owner. A sync code is never stored: only its SHA-256 hash is, so the
-- contents of this table are useless without a code someone already holds.

-- ---------------------------------------------------------------- table ----

create table if not exists public.decks (
  code_hash  text        primary key,
  deck       jsonb       not null,
  version    integer     not null default 1,
  updated_at timestamptz not null default now()
);

-- RLS with no policies: PostgREST can reach nothing here.
-- Deliberately NOT "force row level security" — the functions below run as the
-- table owner, and forcing RLS would apply the (empty) policy set to the owner
-- too and break them.
alter table public.decks enable row level security;

revoke all on table public.decks from public, anon, authenticated;

-- ------------------------------------------------------------- functions ----

-- Code normaliser. Not SECURITY DEFINER and not granted to anyone: it exists
-- only for the two functions below, which call it as the owner. Typing is
-- forgiving — case, dashes and spaces are ignored, and Crockford's ambiguous
-- letters fold onto their digits (I and L to 1, O to 0). U is not in the
-- alphabet and is left alone so it fails validation rather than silently
-- becoming a different code.
create or replace function public._normalize_code(code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select translate(upper(regexp_replace(coalesce(code, ''), '[^0-9A-Za-z]', '', 'g')), 'ILO', '110');
$$;

-- The data format a stored deck was written in: 2 since decks were added,
-- 1 for anything older (which has no format field). Not granted to anyone.
create or replace function public._deck_format(deck jsonb)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(deck -> 'format') = 'number'
              then floor((deck ->> 'format')::numeric)::integer else 1 end;
$$;

-- Reads a deck. Returns an envelope rather than raising when the code is
-- simply unused, so a first run on a new code is not an error.
--   { status: 'ok'|'empty', version: int, deck: jsonb|null, updated_at: ts }
create or replace function public.get_deck(code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_row  public.decks%rowtype;
begin
  v_code := public._normalize_code(get_deck.code);
  if v_code !~ '^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{10}$' then
    raise exception 'invalid sync code';
  end if;

  select * into v_row
    from public.decks d
   where d.code_hash = encode(sha256(convert_to(v_code, 'utf8')), 'hex');

  if not found then
    return jsonb_build_object('status', 'empty', 'version', 0, 'deck', null);
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'version', v_row.version,
    'deck', v_row.deck,
    'updated_at', v_row.updated_at
  );
end;
$$;

-- Writes a deck, but only if the caller's view of the version is still
-- current. On a stale version nothing is written and the current deck comes
-- back with the response, so the caller can merge and retry in one round trip
-- instead of two.
--   { status: 'ok', version: int }
--   { status: 'conflict', version: int, deck: jsonb|null }
create or replace function public.put_deck(code text, deck jsonb, expected_version integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code    text;
  v_hash    text;
  v_current public.decks%rowtype;
  v_version integer;
begin
  v_code := public._normalize_code(put_deck.code);
  if v_code !~ '^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{10}$' then
    raise exception 'invalid sync code';
  end if;
  v_hash := encode(sha256(convert_to(v_code, 'utf8')), 'hex');

  -- Size caps, so the table cannot be used as free general-purpose storage.
  if jsonb_typeof(put_deck.deck) <> 'object' then
    raise exception 'deck must be a JSON object';
  end if;
  if octet_length(put_deck.deck::text) > 1500000 then
    raise exception 'deck too large (limit 1.5 MB)';
  end if;
  if jsonb_typeof(put_deck.deck -> 'cards') = 'array'
     and jsonb_array_length(put_deck.deck -> 'cards') > 10000 then
    raise exception 'too many cards (limit 10000)';
  end if;
  if jsonb_typeof(put_deck.deck -> 'tombstones') = 'array'
     and jsonb_array_length(put_deck.deck -> 'tombstones') > 10000 then
    raise exception 'too many tombstones (limit 10000)';
  end if;
  if jsonb_typeof(put_deck.deck -> 'decks') = 'array'
     and jsonb_array_length(put_deck.deck -> 'decks') > 200 then
    raise exception 'too many decks (limit 200)';
  end if;
  if jsonb_typeof(put_deck.deck -> 'deckTombstones') = 'array'
     and jsonb_array_length(put_deck.deck -> 'deckTombstones') > 1000 then
    raise exception 'too many deck tombstones (limit 1000)';
  end if;

  -- Lock the row for the rest of this transaction so two devices writing at
  -- the same moment are serialised and the version check cannot be raced.
  select * into v_current
    from public.decks d
   where d.code_hash = v_hash
     for update;

  if not found then
    -- A brand new code. Anything other than 0 means the caller thinks it is
    -- updating a deck that does not exist.
    if coalesce(put_deck.expected_version, 0) <> 0 then
      return jsonb_build_object('status', 'conflict', 'version', 0, 'deck', null);
    end if;

    insert into public.decks as d (code_hash, deck, version, updated_at)
    values (v_hash, put_deck.deck, 1, now())
    on conflict (code_hash) do nothing
    returning d.version into v_version;

    if v_version is null then
      -- Another device inserted the same code between the select and here.
      select * into v_current from public.decks d where d.code_hash = v_hash;
      return jsonb_build_object(
        'status', 'conflict', 'version', v_current.version, 'deck', v_current.deck
      );
    end if;

    return jsonb_build_object('status', 'ok', 'version', v_version);
  end if;

  -- A version of the app from before decks would drop them and fold every
  -- deck's words into one, so once a deck is stored in the newer format only
  -- writes in that format are taken. The old app shows a sync error until
  -- the page is reloaded and picks up the new version.
  if public._deck_format(v_current.deck) >= 2 and public._deck_format(put_deck.deck) < 2 then
    raise exception 'this deck needs a newer version of Vocab Box; reload the page';
  end if;

  if v_current.version <> coalesce(put_deck.expected_version, -1) then
    return jsonb_build_object(
      'status', 'conflict', 'version', v_current.version, 'deck', v_current.deck
    );
  end if;

  update public.decks d
     set deck = put_deck.deck,
         version = d.version + 1,
         updated_at = now()
   where d.code_hash = v_hash
  returning d.version into v_version;

  return jsonb_build_object('status', 'ok', 'version', v_version);
end;
$$;

-- ---------------------------------------------------------------- grants ----

-- New functions are executable by PUBLIC by default, so revoke first and then
-- grant only the two entry points.
revoke execute on function public._normalize_code(text) from public, anon, authenticated;
revoke execute on function public._deck_format(jsonb) from public, anon, authenticated;
revoke execute on function public.get_deck(text) from public, anon, authenticated;
revoke execute on function public.put_deck(text, jsonb, integer) from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant execute on function public.get_deck(text) to anon, authenticated;
grant execute on function public.put_deck(text, jsonb, integer) to anon, authenticated;

-- Make PostgREST pick the new functions up without waiting for its own poll.
notify pgrst, 'reload schema';
