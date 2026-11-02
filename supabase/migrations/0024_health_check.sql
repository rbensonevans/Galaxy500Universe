-- Health check for uptime monitoring (/api/health): proves the database
-- answers and reports whether the monthly grants job (pg_cron
-- 'galaxy-monthly-grants', 00:00 UTC on the 1st) ran successfully this month.
-- Members can't read cron tables, so this SECURITY DEFINER function returns
-- only the job's status, never the job's command or other data.
-- Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

create or replace function public.health_check() returns jsonb
language plpgsql security definer set search_path = public stable as $hc$
declare
  v_active boolean;
  v_status text;
  v_start timestamptz;
  v_month_start timestamptz := date_trunc('month', now() at time zone 'utc') at time zone 'utc';
  v_ok boolean;
begin
  begin
    select j.active into v_active from cron.job j where j.jobname = 'galaxy-monthly-grants';
    select d.status, d.start_time into v_status, v_start
      from cron.job_run_details d join cron.job j on j.jobid = d.jobid
      where j.jobname = 'galaxy-monthly-grants'
      order by d.start_time desc limit 1;
  exception when others then
    return jsonb_build_object('ok', false, 'database', true, 'grants_job', 'pg_cron unavailable');
  end;

  -- Healthy when the job is scheduled and its latest run succeeded this month
  -- (allowing two hours after midnight UTC on the 1st for the run to finish).
  v_ok := coalesce(v_active, false)
          and coalesce(v_status = 'succeeded', false)
          and coalesce(v_start >= v_month_start or now() < v_month_start + interval '2 hours', false);

  return jsonb_build_object(
    'ok', v_ok,
    'database', true,
    'grants_job', jsonb_build_object(
      'scheduled', v_active is not null,
      'active', coalesce(v_active, false),
      'last_status', v_status,
      'last_run_at', v_start
    )
  );
end $hc$;

revoke all on function public.health_check() from public;
grant execute on function public.health_check() to anon, authenticated;
