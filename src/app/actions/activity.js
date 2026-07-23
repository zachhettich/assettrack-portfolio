import { supabase } from "../../lib/supabase";

export async function getActivity({ setMessage, setActivity }) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    setMessage(error.message);
    return;
  }

  setActivity(data || []);
}

export async function logActivity({
  toolId = null,
  action,
  details,
  session,
  profile,
  setMessage,
}) {
  if (!session?.user) return true;

  const actorName =
    profile?.full_name ||
    session.user.user_metadata?.full_name ||
    session.user.email;

  const safeToolId = toolId ?? null;

  const resolvedDetails =
    typeof details === "string" ? details.replace("{actor}", actorName) : "";

  const { error } = await supabase.from("activity_log").insert({
    tool_id: safeToolId,
    user_id: session.user.id,
    user_email: session.user.email,
    action,
    details: resolvedDetails,
  });

  if (error) {
    console.error("activity_log insert failed:", error);
    setMessage?.(`Activity log failed: ${error.message}`);
    return false;
  }

  return true;
}
