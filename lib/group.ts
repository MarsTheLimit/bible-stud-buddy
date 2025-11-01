export async function createGroup(supabase: unknown, groupName: string) {
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


export async function joinGroup(supabase: unknown, joinCode: string) {
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

export async function ensureUserProfile(supabase: unknown, userId: string, email: string) {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (!existingProfile) {
    await supabase.from("profiles").insert({ id: userId, email });
  }
}

export async function getUserGroups(supabase: unknown) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return [];

  if (userError) throw new Error(userError.message);

  const { data: userGroups, error } = await supabase
    .from("user_groups")
    .select(`
      group_id,
      group_data:groups (
        id,
        name,
        join_code,
        created_by
      )
    `)
  .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  if (!userGroups) return [];

  return userGroups
    .filter((ug: unknown) => ug.group_data)
    .map((ug: unknown) => ({
      id: ug.group_data.id,
      name: ug.group_data.name,
      join_code: ug.group_data.join_code,
      created_by: ug.group_data.created_by,
      isCreator: ug.group_data.created_by === user.id,
      user_count: 0
    }));
}

