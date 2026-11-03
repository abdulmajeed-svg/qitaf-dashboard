-- PROPOSAL ONLY. Not run by anyone yet. Check the lines marked ASSUMPTION before running it.
--
-- Goal: get_company_dashboard also returns
--   motivation: { up, same, down, n }   (counts; n = up + same + down, "Prefer not to answer" left out)
-- or motivation: null when the company is not reportable or fewer than the minimum gave a real answer.
-- The dashboard already reads this field and shows nothing while it is missing or null.
--
-- How: the existing function (checked against its pg_get_functiondef output) is renamed, untouched, to
-- get_company_dashboard_base. A new get_company_dashboard calls it and adds the field with
--   base || jsonb_build_object('motivation', ...)
-- so the existing body is never rewritten. All access checks stay in the base function (Company HR always
-- gets their own company, ADMIN the requested one, everyone else 'Access denied'), and the new field is
-- built only for the wave the base function returned.
--
-- Same protection as the rest of the function: nothing unless the company is REPORTABLE, and the counts
-- only when at least min_responses employees gave a real answer (stricter than counting
-- "Prefer not to answer" too, because the percentages are taken over that smaller group).
--
-- Canonical codes, not option numbers: response_answers.canonical_code is the column the barriers query
-- in the original function already uses; the codes themselves are defined in question_options.
--
-- The script ends with ROLLBACK, so running it as is changes nothing. Change it to COMMIT once checked.


-- 0. Read-only checks to run first (these change nothing).
--
-- The motivation question and its canonical codes (fills in both ASSUMPTION lines below):
--   select * from question_options where question_code = 'A08';
--
-- While you are there, the reason codes for "Why employees haven't redeemed" (question A04). The dashboard
-- maps SAVE, HOW, BALANCE, MERCHANT, TERMS, TECH, TIME and OTHER (src/lib/format.ts, BARRIER_TEXT);
-- any other code shows as "Other". Compare with:
--   select * from question_options where question_code = 'A04';


begin;

-- Signature and return type match the current definition: (p_company text default null) returns jsonb.
alter function public.get_company_dashboard(text) rename to get_company_dashboard_base;

-- Only the new function may call the base one (it runs as the owner, so it still can).
revoke execute on function public.get_company_dashboard_base(text) from public, anon, authenticated;

create function public.get_company_dashboard(p_company text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_base       jsonb := public.get_company_dashboard_base(p_company);  -- unchanged; does every access check
  v_min        int   := (v_base->>'min_responses')::int;               -- same threshold as the rest
  v_motivation jsonb := null;
begin
  if v_base->>'status' = 'REPORTABLE' then
    select case when t.up + t.same + t.down >= v_min
                then jsonb_build_object('up', t.up, 'same', t.same, 'down', t.down, 'n', t.up + t.same + t.down)
           end
      into v_motivation
    from (
      select
        -- ASSUMPTION: canonical codes; replace with the real ones from check 0.
        -- "Prefer not to answer" belongs to no group, so it is left out of n and the percentages.
        count(*) filter (where a.canonical_code in ('INCREASED_SIGNIFICANTLY', 'INCREASED_SLIGHTLY')) as up,
        count(*) filter (where a.canonical_code = 'NO_CHANGE')                                        as same,
        count(*) filter (where a.canonical_code in ('DECREASED_SLIGHTLY', 'DECREASED_SIGNIFICANTLY')) as down
      from response_answers a
      join responses r on r.response_id = a.response_id
      where r.wave_id = v_base->'wave'->>'wave_id'   -- a wave belongs to one company, as in the barriers query
        and r.audience = 'A'                         -- employees
        and a.question_code = 'A08'                  -- ASSUMPTION: the motivation question's code
    ) t;
  end if;

  return v_base || jsonb_build_object('motivation', v_motivation);
end;
$$;

revoke execute on function public.get_company_dashboard(text) from public, anon;
grant execute on function public.get_company_dashboard(text) to authenticated;

-- Tell the API about the new function.
notify pgrst, 'reload schema';

rollback;  -- change to COMMIT after review


-- After committing: npm run test:access must still pass (Company HR only ever gets their own company,
-- STC and anonymous are refused).
--
-- To undo after a commit:
--   begin;
--   drop function public.get_company_dashboard(text);
--   alter function public.get_company_dashboard_base(text) rename to get_company_dashboard;
--   grant execute on function public.get_company_dashboard(text) to authenticated;
--   notify pgrst, 'reload schema';
--   commit;
