-- PROPOSAL ONLY. Not run by anyone yet.
--
-- Goal: STC users see companies the way ADMIN does: the Portfolio page (get_portfolio), the company
-- picker (list_companies) and any company's results (get_company_dashboard with p_company).
-- STC still cannot open the review queue (get_review_queue is not changed).
-- The dashboard already shows STC the Portfolio and Company results pages; they work once this runs.
--
-- How: each function is re-created from its current definition with only its role check changed, so
-- nothing else in the body is rewritten. A small helper does this and stops with an error, changing
-- nothing, unless the text to change appears exactly once.
--
-- Works before or after the other proposals: if a function was already renamed to ..._base by
-- proposed-motivation.sql or proposed-combined-barriers.sql, the role check is patched there.
--
-- The script ends with ROLLBACK, so running it as is changes nothing. Change it to COMMIT once checked.


-- 0. Read-only check to run first (changes nothing): the current definitions, to find each role check.
--   select p.oid::regprocedure, pg_get_functiondef(p.oid)
--   from pg_proc p
--   where p.pronamespace = 'public'::regnamespace
--     and p.proname in ('get_portfolio', 'get_portfolio_base', 'list_companies');


begin;

-- Re-creates a function from its current definition with one exact piece of text replaced.
create function pg_temp.patch_function(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare
  d text := pg_get_functiondef(p_fn);
  n int := (length(d) - length(replace(d, p_old, ''))) / length(p_old);
begin
  if n <> 1 then
    raise exception '%: expected this text exactly once, found it % times: %', p_fn, n, p_old;
  end if;
  execute replace(d, p_old, p_new);
end;
$$;

-- get_company_dashboard: STC may pass any company, like ADMIN. Company HR still always gets their own.
-- (This line is from the definition in get_company_dashboard_ORIGINAL.sql.)
select pg_temp.patch_function(
  coalesce(to_regprocedure('public.get_company_dashboard_base(text)'), 'public.get_company_dashboard(text)'::regprocedure),
  $t$elsif v_role = 'ADMIN' then$t$,
  $t$elsif v_role in ('ADMIN', 'STC') then$t$);

-- get_portfolio and list_companies: TO FILL IN from check 0. Their definitions are not in the repo, so the
-- exact ADMIN-only line is not known yet. Paste that line as the second argument and the same line
-- allowing ADMIN and STC as the third. Until then these two calls stop the script, changing nothing.
select pg_temp.patch_function(
  coalesce(to_regprocedure('public.get_portfolio_base()'), 'public.get_portfolio()'::regprocedure),
  $t$<<the ADMIN-only line in get_portfolio>>$t$,
  $t$<<the same line allowing ADMIN and STC>>$t$);

select pg_temp.patch_function(
  'public.list_companies()'::regprocedure,
  $t$<<the ADMIN-only line in list_companies>>$t$,
  $t$<<the same line allowing ADMIN and STC>>$t$);

notify pgrst, 'reload schema';

rollback;  -- change to COMMIT after review


-- After committing: npm run test:access (its STC section now expects these three to work and the
-- review queue to stay refused).
--
-- To undo: run the same three patches with the second and third arguments swapped.
