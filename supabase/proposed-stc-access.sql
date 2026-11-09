-- PROPOSAL ONLY. Not run by anyone yet.
--
-- Goal:
--   1. get_company_dashboard stops sending the HR / IT assessment answers ("org"). The dashboard no longer
--      shows them to anyone, but every caller still received them (Company HR got their IT answers too).
--   2. STC can open any company's results like ADMIN: get_company_dashboard with p_company, and the company
--      picker (list_companies). STC is still refused the Portfolio (get_portfolio), the review queue
--      (get_review_queue) and purchases (see proposed-tracking-admin-hr-only.sql); none of those change here.
-- Step 1 runs first, so STC never receives the assessment answers.
--
-- How: get_company_dashboard is re-created from its current definition with only two pieces of text
-- changed, so nothing else in its body is rewritten; a small helper does this and stops with an error,
-- changing nothing, unless each text appears exactly once. list_companies is renamed, untouched, to
-- list_companies_base, and a new list_companies answers STC itself and passes everyone else to the original.
--
-- Works before or after proposed-motivation.sql: if get_company_dashboard was already renamed to
-- get_company_dashboard_base, that is the one patched.
--
-- The script ends with ROLLBACK, so running it as is changes nothing. Change it to COMMIT once checked.


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

-- 1. No more assessment answers in the response (the key stays, empty). Text from get_company_dashboard_ORIGINAL.sql.
select pg_temp.patch_function(
  coalesce(to_regprocedure('public.get_company_dashboard_base(text)'), 'public.get_company_dashboard(text)'::regprocedure),
  $t$'org', v_org,$t$,
  $t$'org', null,$t$);

-- 2a. STC may pass any company, like ADMIN. Company HR still always get their own.
select pg_temp.patch_function(
  coalesce(to_regprocedure('public.get_company_dashboard_base(text)'), 'public.get_company_dashboard(text)'::regprocedure),
  $t$elsif v_role = 'ADMIN' then$t$,
  $t$elsif v_role in ('ADMIN', 'STC') then$t$);

-- 2b. The company picker for STC: the companies get_company_dashboard can open (one row per company in
-- _wave_stats(), the same source it uses), as [{company_id, name}]. Everyone else: the original, unchanged.
alter function public.list_companies() rename to list_companies_base;
revoke execute on function public.list_companies_base() from public, anon, authenticated;

create function public.list_companies()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_role text;
  v      jsonb;
begin
  select ur.role into v_role from user_roles ur where ur.user_id = auth.uid();
  if v_role = 'STC' then
    return coalesce((select jsonb_agg(jsonb_build_object('company_id', w.company_id, 'name', w.display_name)
                                      order by w.display_name)
                     from _wave_stats() w), '[]'::jsonb);
  end if;
  -- Same answer (and the same refusals) as before, whether the original returns json or rows.
  if pg_get_function_result('public.list_companies_base()'::regprocedure) in ('json', 'jsonb') then
    execute 'select public.list_companies_base()::jsonb' into v;
  else
    execute 'select coalesce(jsonb_agg(to_jsonb(b)), ''[]''::jsonb) from public.list_companies_base() b' into v;
  end if;
  return v;
end;
$$;

revoke execute on function public.list_companies() from public, anon;
grant execute on function public.list_companies() to authenticated;

notify pgrst, 'reload schema';

rollback;  -- change to COMMIT after review


-- After committing: npm run test:access. Its STC section expects the company picker and company results to
-- work, and the Portfolio, the review queue and purchases to stay refused.
--
-- To undo after a commit:
--   begin;
--   (create pg_temp.patch_function again, as above)
--   select pg_temp.patch_function(<same function as above>, $t$elsif v_role in ('ADMIN', 'STC') then$t$, $t$elsif v_role = 'ADMIN' then$t$);
--   select pg_temp.patch_function(<same function as above>, $t$'org', null,$t$, $t$'org', v_org,$t$);
--   drop function public.list_companies();
--   alter function public.list_companies_base() rename to list_companies;
--   grant execute on function public.list_companies() to authenticated;
--   notify pgrst, 'reload schema';
--   commit;
