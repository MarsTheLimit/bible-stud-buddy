import { supabase } from "../lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

function getUserTimeZoneOffsetISO(dateStr: string): string {
  const localDate = new Date(dateStr);

  // Get the user's timezone offset in minutes (negative for UTC+)
  const offsetMinutes = localDate.getTimezoneOffset();

  // Build timezone offset string (e.g., "-05:00")
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60)
    .toString()
    .padStart(2, "0");
  const offsetMins = (Math.abs(offsetMinutes) % 60)
    .toString()
    .padStart(2, "0");
  const sign = offsetMinutes > 0 ? "-" : "+";

  const offsetStr = `${sign}${offsetHours}:${offsetMins}`;

  // Create ISO string manually (without converting to UTC)
  const localTime = localDate.toISOString().slice(0, 19); // remove 'Z'
  return `${localTime}${offsetStr}`;
}

export async function addEventsToPlanner(
  userId: string,
  plannerId: string,
  events: { title: string; description: string; start: string; end: string }[]
) {
  if (!events || events.length === 0) return [];

  const formattedEvents = events.map((ev) => ({
    id: uuidv4(),
    group_id: null,
    title: ev.title,
    description: ev.description || "",
    date: getUserTimeZoneOffsetISO(ev.start),     // keep same wall time, label timezone
    end_date: getUserTimeZoneOffsetISO(ev.end),
    created_by: userId,
    schedule_id: plannerId
  }));

  const { data, error } = await supabase
    .from("events")
    .insert(formattedEvents)
    .select();

  if (error) throw new Error(error.message);

  return data;
}

export async function createPlanner(userId: string, plannerName: string) {
    const { data: planner, error: plannerError } = await supabase
        .from("planners")
        .insert([{ name: plannerName, owned_by: userId }])
        .select()
        .single();

    if (plannerError) throw new Error(plannerError.message);
    if (!planner?.id) throw new Error("Planner insert failed");
    
    return planner;
}

export async function deletePlanner(userId: string, plannerId: string) {
  try {
    // 1. Delete all events for this planner
    const { error: eventsError } = await supabase
      .from("events")
      .delete()
      .eq("schedule_id", plannerId);
    if (eventsError) throw eventsError;

    // 2. Delete the planner itself
    const { error: plannerError } = await supabase
      .from("planners")
      .delete()
      .eq("id", plannerId)
      .eq("owned_by", userId);
    if (plannerError) throw plannerError;

    // 3. Remove planner from user's profile
    // First, fetch the current array
    const { data: profileData, error: profileFetchError } = await supabase
      .from("profiles")
      .select("planners")
      .eq("id", userId)
      .single();
    if (profileFetchError) throw profileFetchError;

    const currentPlanners: string[] = profileData?.planners || [];
    const updatedPlanners = currentPlanners.filter(id => id !== plannerId);

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ planners: updatedPlanners })
      .eq("id", userId);
    if (profileUpdateError) throw profileUpdateError;

    return { success: true };
  } catch (err) {
    console.error("deletePlanner error:", err);
    return { success: false, error: err };
  }
}