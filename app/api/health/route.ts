import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Uptime check for UptimeRobot: 200 {"status":"ok"} when the database answers
// and the monthly grants job ran this month, otherwise 503 with the reason.
// Public and read-only; reveals no member data.
export async function GET() {
  const started = Date.now();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("health_check");
  const ms = Date.now() - started;
  const headers = { "Cache-Control": "no-store" };

  if (error) {
    return NextResponse.json(
      { status: "error", database: false, error: error.message, ms },
      { status: 503, headers },
    );
  }

  const ok = data?.ok === true;
  return NextResponse.json(
    { status: ok ? "ok" : "degraded", ...data, ms },
    { status: ok ? 200 : 503, headers },
  );
}
