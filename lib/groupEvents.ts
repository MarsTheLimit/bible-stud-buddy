export async function getGroupEvents(supabase: any, groupId: string | null) {
  let query = supabase.from("events").select("*").order("date", { ascending: true });

  if (groupId) {
    // For group events
    query = query.eq("group_id", groupId);
  } else {
    // For personal events — events without a group_id
    query = query.is("group_id", null);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function isUserEventCreator(
  supabase: any,
  userId: string,
  eventId: string
): Promise<boolean> {
  if (!userId || !eventId) return false;

  const { data, error } = await supabase
    .from("events")
    .select("created_by")
    .eq("id", eventId)
    .single();

  if (error) {
    console.error("Error checking event creator:", error);
    return false;
  }

  return data?.created_by === userId;
}

export async function getGroupFromEvent(supabase: any, eventId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("group_id, groups(name)")
    .eq("id", eventId)
    .single();

  if (error) {
    console.error("Error fetching group from event:", error);
    return null;
  }

  // Return just the group name
  return data?.groups?.name || null;
}

export async function createEvent(supabase : any, groupId: string | null, title: string, description: string, date: string, endDate : string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("events")
    .insert([{ group_id: groupId, title, description, date, created_by: user.id, end_date: endDate }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(supabase : any, eventId: string) {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
}
