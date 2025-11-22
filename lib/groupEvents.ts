import { SupabaseClient, User } from "@supabase/supabase-js";
import { UserAccount } from "./hooks/useUserAccount";

export type Event = {
  id: string;
  title: string;
  description: string;
  date: Date;
  end_date: Date;
  schedule_id: string;
  start: Date;
  end: Date;
  calendarId: string;
  isPersonal: boolean;
  isCreator: boolean;
  backgroundColor: string;
  groupName: string | null;
  group: undefined;
  isGoogleEvent: boolean;
  idx: number;
};


export type EventGroupData = {
  group_id: string;
  groups: {
    id: string;
    name: string;
    join_code: string;
    created_by: string;
  } | undefined;
  name: string;
  creator_id: string | undefined;
};

export async function getGroupEvents(supabase: SupabaseClient, groupId: string | null | undefined) {
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

export async function isUserEventCreator(supabase: SupabaseClient, userId: string, eventId: string): Promise<boolean> {
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

export async function getGroupFromEvent(
  supabase: SupabaseClient,
  eventId: string,
  justName: true
): Promise<string | null>;

export async function getGroupFromEvent(
  supabase: SupabaseClient,
  eventId: string,
  justName?: false
): Promise<EventGroupData>;

export async function getGroupFromEvent(
  supabase: SupabaseClient,
  eventId: string,
  justName: boolean = false
): Promise<string | EventGroupData | null> {
  const { data, error } = await supabase
    .from("events")
    .select("group_id, groups(name)")
    .eq("id", eventId)
    .single<EventGroupData>();

  if (error) {
    console.error("Error fetching group from event:", error);
    return null;
  }
  if (justName) return data?.groups?.name || null;
  else return data || null;
}

export async function createEvent(supabase : SupabaseClient, groupId: string | null, title: string, description: string, date: string, endDate : string) {
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

export async function updateEvent(
  supabase: SupabaseClient, 
  eventId: string | undefined, 
  title: string, 
  description: string, 
  date: string, 
  endDate: string
) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("events")
    .update({ title, description, date, end_date: endDate })
    .eq("id", eventId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(supabase : SupabaseClient, eventId: string) {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
}

export async function loadGoogleEvents(
  accountData: UserAccount | undefined,
  month: boolean
): Promise<Event[]> {
  try {
    const filterByDateRange = (events: Event[]) => {
      if (!month) return events;

      const now = new Date();
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

      return events.filter((event) => {
        const eventStart = new Date(event?.start);
        return eventStart >= now && eventStart <= oneMonthFromNow;
      });
    };

    if (accountData?.google_access_token) {
      try {
        const res = await fetch("/api/google/events", {
          method: "POST",
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accountData.google_access_token,
            refresh_token: accountData.google_refresh_token,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const googleMapped = data.events.map((e: Event, idx: number) => ({
            id: e.id,
            title: `${e.title} (Google Calendar)`,
            start: new Date(e.start),
            end: new Date(e.end),
            isPersonal: false,
            isCreator: false,
            backgroundColor: "#f4b400ff", // keep Google events yellow
            groupName: e.calendarId !== "primary" ? e.calendarId : null,
            isGoogleEvent: true,
            idx,
          }));

          return filterByDateRange(googleMapped);
        } else {
          console.error("Google events fetch error");
          return []; // Add return statement
        }
      } catch (error) {
        console.error("Error fetching Google events:", error);
        return []; // Add return statement
      }
    }

    return [];
  } catch (error) {
    console.error("Error fetching Google events:", error);
    return [];
  }
}

export async function loadEvents(
  supabase: SupabaseClient, 
  isPersonal: boolean, 
  user: User | null, 
  groupIds: string[],
  maxDate: Date | null = null,
) : Promise<Event[]> {
  if (!user) return [];
  try {
    let combinedEvents: Event[] = [];

    const filterByDateRange = (events: Event[]) => {
      if (!maxDate) return events;

      const now = new Date();
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

      return events.filter((event) => {
        const eventStart = new Date(event.start);
        return eventStart >= now && eventStart <= oneMonthFromNow;
      });
    };

    // --- Personal events ---
    if (isPersonal) {
      const personalData = await getGroupEvents(supabase, null);
      const personalMapped = await Promise.all(
        personalData.map(async (e: Event, idx: number) => ({
          id: e.id,
          title: e.title,
          details: e.description,
          start: new Date(e.date),
          end: new Date(e.end_date),
          isPersonal: true,
          isCreator: await isUserEventCreator(supabase, user.id, e.id),
          backgroundColor: e.schedule_id ? "#ff0000" : "#0cd64fff",
          groupName: null,
          idx,

          // TODO: REMOVE THESE LATER
          description: e.description, // Re-add if separate from 'details'
          date: new Date(e.date), // Required by Event type
          end_date: new Date(e.end_date), // Required by Event type
          schedule_id: e.schedule_id, // Required by Event type
          calendarId: "", // Provide a default or derived value
          group: undefined, // Required by Event type
          isGoogleEvent: false, // Provide a default value
        }))
      );
      combinedEvents = [...combinedEvents, ...filterByDateRange(personalMapped)];

      // --- All group events ---
      if (groupIds && groupIds.length > 0) {
        for (const gid of groupIds) {
          const groupData = await getGroupEvents(supabase, gid);
          const groupMapped = await Promise.all(
            groupData.map(async (e: Event, idx: number) => {
              const groupName = await getGroupFromEvent(supabase, e.id, true);
              return {
                id: e.id,
                title: groupName ? `${groupName} - ${e.title}` : e.title,
                description: e.description ?? "",
                date: new Date(e.date),
                end_date: new Date(e.end_date),
                schedule_id: e.schedule_id ?? "",
                start: new Date(e.date),
                end: new Date(e.end_date),
                calendarId: "", // default empty string
                isPersonal: false,
                isCreator: await isUserEventCreator(supabase, user.id, e.id),
                backgroundColor: e.schedule_id ? "#ff0000" : "#3b92f6ff",
                groupName: groupName,
                group: undefined,
                isGoogleEvent: false,
                idx,
              };
            })
          );
          combinedEvents = [...combinedEvents, ...filterByDateRange(groupMapped)];
        }
      }
    } else {
      // --- Group calendar: only first group ---
      if (groupIds && groupIds.length > 0) {
        const firstGroupId = groupIds[0];
        const groupData = await getGroupEvents(supabase, firstGroupId);
        const groupMapped = await Promise.all(
          groupData.map(async (e: Event, idx: number) => {
            const groupName = await getGroupFromEvent(supabase, e.id, true);
            return {
              id: e.id,
              title: e.title,
              description: e.description ?? "",
              date: new Date(e.date),
              end_date: new Date(e.end_date),
              schedule_id: e.schedule_id ?? "",
              start: new Date(e.date),
              end: new Date(e.end_date),
              calendarId: "",
              isPersonal: false,
              isCreator: await isUserEventCreator(supabase, user.id, e.id),
              backgroundColor: e.schedule_id ? "#ff0000" : "#3b92f6ff",
              groupName: groupName,
              group: undefined,
              isGoogleEvent: false,
              idx,
            };
          })
        );
        combinedEvents = [...combinedEvents, ...filterByDateRange(groupMapped)];
      }
    }

    // setEvents(combinedEvents);
    return combinedEvents;
  } catch (error) {
    console.error("Error loading events:", error);
    return [];
  }
}