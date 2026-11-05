-- PROPOSAL ONLY. Not run by anyone yet. Check the lines marked ASSUMPTION before running it.
--
-- Goal: the Portfolio page (get_portfolio) and the STC view (get_stc_overview) also return
--   barriers: [{ reason, count }, ...]   (reasons for not redeeming, all companies added together)
-- or barriers: null when no company qualifies. The dashboard already shows a pie chart from this field
-- and shows nothing while it is missing or null.
--
-- Which companies count: a company (its latest survey round, as in _wave_stats()) is added only when its
-- own reasons chart is visible on its company page: results available (responded >= min_responses) and
-- at least min_responses answers to A04, the same rule as get_company_dashboard. So the combined chart
-- never adds answers that are hidden elsewhere.
--   Portfolio: every such company, pilot included (as on the rest of the Portfolio page).
--   STC view: pilot excluded, only when the STC view itself shows results, and only when at least
--   3 companies qualify, matching the STC view's own "at least 3 companies" rule.
--
-- How: the existing functions are renamed, untouched, to ..._base. New get_portfolio and get_stc_overview
-- call them (so every access check stays as it is) and add the field with
--   base || jsonb_build_object('barriers', ...)
--
-- The script ends with ROLLBACK, so running it as is changes nothing. Change it to COMMIT once checked.


-- 0. Read-only check to run first (changes nothing): both functions take no arguments.
--   select p.oid::regprocedure, pg_get_function_result(p.oid), p.prosecdef
--   from pg_proc p
--   where p.pronamespace = 'public'::regnamespace and p.proname in ('get_portfolio', 'get_stc_overview');


begin;

create function public._combined_barriers(p_include_pilot boolean, p_min_companies int)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $$
  with waves as (
    select w.wave_id
    from _wave_stats() w
    where w.responded >= w.min_responses
      and (p_include_pilot or w.record_type is distinct from 'PILOT')
      and (select count(*)
           from response_answers a join responses r on r.response_id = a.response_id
           where r.wave_id = w.wave_id and r.audience = 'A' and a.question_code = 'A04') >= w.min_responses
  ),
  reasons as (
    select a.canonical_code as reason, count(*) as cnt
    from response_answers a join responses r on r.response_id = a.response_id
    where r.wave_id in (select wave_id from waves) and r.audience = 'A' and a.question_code = 'A04'
    group by a.canonical_code
    union all
    -- ASSUMPTION: the same NOT_RECEIVED rule as your updated get_company_dashboard
    -- (question A02, option_index 3: "I do not think I received points from my employer").
    select 'NOT_RECEIVED', count(*)
    from response_answers a join responses r on r.response_id = a.response_id
    where r.wave_id in (select wave_id from waves) and r.audience = 'A'
      and a.question_code = 'A02' and a.option_index = 3
  )
  select jsonb_agg(jsonb_build_object('reason', x.reason, 'count', x.cnt) order by x.cnt desc)
  from (select reason, sum(cnt)::int as cnt from reasons group by reason having sum(cnt) > 0) x
  where (select count(*) from waves) >= p_min_companies;
$$;

-- Only the two functions below call it.
revoke execute on function public._combined_barriers(boolean, int) from public, anon, authenticated;


-- Portfolio.
alter function public.get_portfolio() rename to get_portfolio_base;
revoke execute on function public.get_portfolio_base() from public, anon, authenticated;

create function public.get_portfolio()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_base jsonb := public.get_portfolio_base()::jsonb;  -- unchanged; does the access check first
begin
  return v_base || jsonb_build_object('barriers', public._combined_barriers(true, 1));
end;
$$;

revoke execute on function public.get_portfolio() from public, anon;
grant execute on function public.get_portfolio() to authenticated;


-- STC view.
alter function public.get_stc_overview() rename to get_stc_overview_base;
revoke execute on function public.get_stc_overview_base() from public, anon, authenticated;

create function public.get_stc_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_base jsonb := public.get_stc_overview_base()::jsonb;  -- unchanged; does the access check first
begin
  return v_base || jsonb_build_object('barriers',
    case when v_base->>'status' = 'REPORTABLE' then public._combined_barriers(false, 3) end);
end;
$$;

revoke execute on function public.get_stc_overview() from public, anon;
grant execute on function public.get_stc_overview() to authenticated;

notify pgrst, 'reload schema';

rollback;  -- change to COMMIT after review


-- After committing: npm run test:access must still pass.
--
-- To undo after a commit:
--   begin;
--   drop function public.get_portfolio();
--   alter function public.get_portfolio_base() rename to get_portfolio;
--   grant execute on function public.get_portfolio() to authenticated;
--   drop function public.get_stc_overview();
--   alter function public.get_stc_overview_base() rename to get_stc_overview;
--   grant execute on function public.get_stc_overview() to authenticated;
--   drop function public._combined_barriers(boolean, int);
--   notify pgrst, 'reload schema';
--   commit;
