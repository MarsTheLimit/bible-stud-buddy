import type { SupabaseClient } from "@supabase/supabase-js";

export async function createGroup(supabase: SupabaseClient, groupName: string) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("You must be logged in to create a group.");

  // Ensure profile exists
  await ensureUserProfile(supabase, user.id, user.email);

  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Create group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert([{ name: groupName, join_code: joinCode, created_by: user.id }])
    .select()
    .single();

  if (groupError) throw new Error(groupError.message);

  // Add user to group safely
  const { data: existing } = await supabase
    .from("user_groups")
    .select("*")
    .eq("user_id", user.id)
    .eq("group_id", group.id)
    .single();

  if (!existing) {
    const { error: joinError } = await supabase
      .from("user_groups")
      .insert([{ user_id: user.id, group_id: group.id }]);
    if (joinError) throw new Error("Group created, but failed to add you to the group: " + joinError.message);
  }

  return group;
}


export async function joinGroup(supabase: SupabaseClient, joinCode: string) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not logged in");

  // Ensure profile exists
  await ensureUserProfile(supabase, user.id, user.email);

  // Fetch group by join code
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("join_code", joinCode)
    .single();

  if (groupError || !group) throw new Error("Invalid join code");

  // Add user to group safely
  const { data: existing } = await supabase
    .from("user_groups")
    .select("*")
    .eq("user_id", user.id)
    .eq("group_id", group.id)
    .single();

  if (!existing) {
    const { error: joinError } = await supabase
      .from("user_groups")
      .insert([{ user_id: user.id, group_id: group.id }]);
    if (joinError) throw new Error("Failed to join group: " + joinError.message);
  }

  return group;
}

export async function ensureUserProfile(supabase: SupabaseClient, userId: string, email: string | undefined) {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (!existingProfile) {
    await supabase.from("profiles").insert({ id: userId, email });
  }
}

export async function getUserGroups(supabase: SupabaseClient) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return [];

  if (userError) throw new Error(userError.message);

  // First get the user's group IDs
  const { data: userGroupLinks, error: linkError } = await supabase
    .from("user_groups")
    .select("group_id")
    .eq("user_id", user.id);

  if (linkError) throw new Error(linkError.message);
  if (!userGroupLinks || userGroupLinks.length === 0) return [];

  const groupIds = userGroupLinks.map(ug => ug.group_id);

  // Then fetch all the group details
  const { data: groups, error: groupError } = await supabase
    .from("groups")
    .select("id, name, join_code, created_by")
    .in("id", groupIds);

  if (groupError) throw new Error(groupError.message);
  if (!groups) return [];

  return groups.map(group => ({
    id: group.id,
    name: group.name,
    join_code: group.join_code,
    created_by: group.created_by,
    isCreator: group.created_by === user.id,
    user_count: 0
  }));
}

