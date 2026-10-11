-- Optional: run once in the Supabase SQL editor AFTER schema.sql.
-- Calls the functions as the `anon` role, exactly as the browser will, checks
-- every guarantee the app relies on, then deletes its test row. It raises on
-- the first failure; if it finishes you will see "all checks passed".

do $$
declare
  r jsonb;
  big jsonb := jsonb_build_object('cards',
    (select jsonb_agg(repeat('x', 100)) from generate_series(1, 6000)));
begin
  set local role anon;

  -- An unused code is not an error.
  r := public.get_deck('TEST0-00001');
  assert r->>'status' = 'empty' and (r->>'version')::int = 0, 'unused code: ' || r;

  -- First write creates version 1.
  r := public.put_deck('TEST0-00001', '{"cards":[]}', 0);
  assert r->>'status' = 'ok' and (r->>'version')::int = 1, 'first write: ' || r;

  -- A stale write is refused and returns the current deck to merge with.
  r := public.put_deck('TEST0-00001', '{"cards":[1]}', 0);
  assert r->>'status' = 'conflict' and (r->>'version')::int = 1
     and r->'deck' = '{"cards":[]}', 'stale write: ' || r;

  -- Case, spaces and Crockford look-alikes (I -> 1) reach the same deck.
  r := public.put_deck('test0 0000I', '{"cards":[1]}', 1);
  assert r->>'status' = 'ok' and (r->>'version')::int = 2, 'normalised write: ' || r;
  r := public.get_deck('TEST0-00001');
  assert (r->>'version')::int = 2 and r->'deck' = '{"cards":[1]}', 'read back: ' || r;

  -- The table itself is unreachable.
  begin
    perform 1 from public.decks;
    raise exception 'FAIL: anon could read the table';
  exception when insufficient_privilege then null;
  end;

  -- So is the helper.
  begin
    perform public._normalize_code('x');
    raise exception 'FAIL: anon could call _normalize_code';
  exception when insufficient_privilege then null;
  end;

  -- Malformed input is rejected with the expected message.
  begin
    perform public.get_deck('ABC');
    raise exception 'FAIL: short code accepted';
  exception when raise_exception then
    if sqlerrm <> 'invalid sync code' then raise; end if;
  end;
  begin
    perform public.put_deck('TEST0-00001', '[]', 2);
    raise exception 'FAIL: non-object deck accepted';
  exception when raise_exception then
    if sqlerrm <> 'deck must be a JSON object' then raise; end if;
  end;
  begin
    perform public.put_deck('TEST0-00001', big, 2);
    raise exception 'FAIL: oversized deck accepted';
  exception when raise_exception then
    if sqlerrm <> 'deck too large (limit 500 kB)' then raise; end if;
  end;

  reset role;
  delete from public.decks
   where code_hash = encode(sha256(convert_to('TEST000001', 'utf8')), 'hex');
  raise notice 'all checks passed';
end $$;
