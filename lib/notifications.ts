import type { SupabaseClient } from "@supabase/supabase-js";

type Notification = {
  id: string;
  sender: string;
  recipient: string;
  msg_type: "group_alert" | "prayer_req" | "absent";
  msg_content: string | MessageContent;
  created_at: string;
};

type MessageContent = {
  title: string;
  content: string;
  datetime_sent: string;
  event?: {
    id: string[];
    name: string[];
    date: string[];
  };
};

type Group = {
  group_id: string;
  groups: {
    id: string;
    name: string;
    join_code: string;
    created_by: string;
  };
};

type Event = {
  id: string;
  title: string;
  start: string | Date;
  end?: string | Date;
};

export async function getGroupNotifs(supabase: SupabaseClient, groupId: string) {
  const { data, error } = await supabase
    .from("user_messages")
    .select("*")
    .eq("recipient", groupId);

  if (error) throw error;
  return data;
}

export async function createNotif(
  supabase: SupabaseClient,
  group: Group,
  event: Event | null,
  msg_type: "group_alert" | "prayer_req" | "absent",
  details: string = "",
  anonymous: boolean = true
) {
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data?.user) {
    console.error("Failed to get current user:", userError);
    return null;
  }

  const user = data.user;
  const now = new Date().toISOString();

  // --- Build message content based on msg_type ---
  let msg_content: MessageContent;

  switch (msg_type) {
    case "group_alert":
      msg_content = {
        title: `${group.groups.name} Update`,
        content: details,
        datetime_sent: now,
        event: {
          id: event?.id ? [event.id] : [],
          name: event?.title ? [event.title] : [],
          date: event?.start ? [typeof event.start === 'string' ? event.start : event.start.toISOString()] : []
        },
      };
      break;

    case "prayer_req":
      msg_content = {
        title: `${anonymous ? "Anonymous p" : "P"}rayer request for ${anonymous ? "a member" : user.email || "a member"}`,
        content: details || `No details provided`,
        datetime_sent: now,
      };
      break;

    case "absent":
      msg_content = {
        title: `${group.groups.name} Absence`,
        content: `${user.email || "A member"} won't be able to attend ${event?.title || "the event"}.`,
        datetime_sent: now,
      };
      break;

    default:
      console.error("Invalid msg_type:", msg_type);
      return null;
  }

  // --- Insert notification into the database ---
  const { data: notif, error: insertError } = await supabase
    .from("user_messages")
    .insert([
      {
        sender: user.id,
        recipient: group.group_id,
        msg_type,
        msg_content, // stored as JSONB
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error("Error creating notification:", insertError);
    return null;
  }
  return notif;
}

export async function getGroupNotifications(supabase: SupabaseClient, groupIds: string[]) {
  if (!groupIds || groupIds.length === 0) {
    console.log("Waiting for groups to load...");
    return [];
  }
  if (!Array.isArray(groupIds)) {
    console.warn("getGroupNotifications called with invalid groupIds:", groupIds);
    return [];
  }

  const { data, error } = await supabase
    .from("user_messages")
    .select("*")
    .in("recipient", groupIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }

  // Parse msg_content (since it's JSONB)
  const parsed = data.map((n: Notification) => ({
    ...n,
    msg_content:
      typeof n.msg_content === "string"
        ? JSON.parse(n.msg_content)
        : n.msg_content,
  }));

  return parsed;
}

export async function isUserGroupOwner(supabase: SupabaseClient, userId: string, groupId: string) {
  if (!groupId || !userId) return false;

  const { data, error } = await supabase
    .from("groups")
    .select("created_by")
    .eq("id", groupId)
    .single();

  if (error) {
    console.error("Error checking group owner:", error);
    return false;
  }
  return data?.created_by === userId;
}