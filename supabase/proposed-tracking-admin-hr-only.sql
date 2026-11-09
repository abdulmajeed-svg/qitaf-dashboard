-- PROPOSAL ONLY. Not run by anyone yet.
--
-- Goal: only ADMIN and COMPANY_HR may call get_points_tracking. STC, and anyone else, gets "Access denied".
--
-- How: the existing function is renamed, untouched, to get_points_tracking_base. A new get_points_tracking
-- checks the caller's role first (from user_roles, the same way get_company_dashboard reads it) and then
-- returns exactly what the base function returns, so Company HR still only ever get their own company.
-- add_points_purchase is not changed (it is already Admin only).
--
-- The script ends with ROLLBACK, so running it as is changes nothing. Change it to COMMIT once checked.


-- 0. Read-only check to run first (changes nothing): the signature should be (p_company text).
--   select p.oid::regprocedure, pg_get_function_result(p.oid)
--   from pg_proc p
--   where p.pronamespace = 'public'::regnamespace and p.proname = 'get_points_tracking';


begin;

alter function public.get_points_tracking(text) rename to get_points_tracking_base;
revoke execute on function public.get_points_tracking_base(text) from public, anon, authenticated;

create function public.get_points_tracking(p_company text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_role text;
begin
  select ur.role into v_role from user_roles ur where ur.user_id = auth.uid();
  if v_role is null or v_role not in ('ADMIN', 'COMPANY_HR') then
    raise exception 'Access denied';
  end if;
  return public.get_points_tracking_base(p_company)::jsonb;  -- unchanged rules for ADMIN and COMPANY_HR
end;
$$;

revoke execute on function public.get_points_tracking(text) from public, anon;
grant execute on function public.get_points_tracking(text) to authenticated;

notify pgrst, 'reload schema';

rollback;  -- change to COMMIT after review


-- After committing: npm run test:access (STC is now expected to be refused get_points_tracking).
--
-- To undo after a commit:
--   begin;
--   drop function public.get_points_tracking(text);
--   alter function public.get_points_tracking_base(text) rename to get_points_tracking;
--   grant execute on function public.get_points_tracking(text) to authenticated;
--   notify pgrst, 'reload schema';
--   commit;
