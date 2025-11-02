import { SupabaseClient } from "@supabase/supabase-js";

type Event = {
  id: string,
  title: string,
  description: string,
  date: Date,
  end_date: Date,
  schedule_id: string,
  start: Date,
  end: Date,
  calendarId: string
}

export async function getGroupEvents(supabase: SupabaseClient, groupId: string | null) {
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

export async function getGroupFromEvent(supabase: SupabaseClient, eventId: string, justName: boolean=false) {
  const { data, error } = await supabase
    .from("events")
    .select("group_id, groups(name)")
    .eq("id", eventId)
    .single();

  if (error) {
    console.error("Error fetching group from event:", error);
    return null;
  }
  if (justName) return data.groups.name;
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

export async function deleteEvent(supabase : SupabaseClient, eventId: string) {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
}


export async function loadEvents(
  supabase: SupabaseClient, 
  isPersonal: boolean, 
  user: unknown, 
  groupIds: string[], 
  accountData: unknown, 
  setGoogleEvents: ((events: unknown) => void) | null, 
  // setEvents: (events: unknown) => void | null,
  maxDate: Date | null = null,
  proAccess: boolean | null = true
) {
  try {
    let combinedEvents: unknown[] = [];

    const filterByDateRange = (events: unknown[]) => {
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
                details: e.description,
                start: new Date(e.date),
                end: new Date(e.end_date),
                isPersonal: false,
                isCreator: await isUserEventCreator(supabase, user.id, e.id),
                backgroundColor: e.schedule_id ? "#ff0000" : "#3b92f6ff", // red if planner, else blue
                groupName: groupName,
                idx,
              };
            })
          );
          combinedEvents = [...combinedEvents, ...filterByDateRange(groupMapped)];
        }

        // --- Google Calendar events ---
        if (accountData?.google_access_token && proAccess) {
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

              const filteredGoogleEvents = filterByDateRange(googleMapped);
              if (setGoogleEvents) setGoogleEvents(filteredGoogleEvents);
              else combinedEvents = [...combinedEvents, ...filteredGoogleEvents];
            } else {
              console.error("Google events fetch error");
            }
          } catch (error) {
            console.error("Error fetching Google events:", error);
          }
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
              details: e.description,
              start: new Date(e.date),
              end: new Date(e.end_date),
              isPersonal: false,
              isCreator: await isUserEventCreator(supabase, user.id, e.id),
              backgroundColor: e.schedule_id ? "#ff0000" : "#3b92f6ff", // planner red else blue
              groupName: groupName,
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