"use client";
import { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { getGroupEvents, createEvent, isUserEventCreator, getGroupFromEvent } from "@/lib/groupEvents";
import EventInput from "./EventInput";
import EventPopup from "./EventPopup";
import { useUserAccount } from "@/lib/hooks/useUserAccount";

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

export default function EventsCalendar({groupIds,isCreator,isPersonal,}: {groupIds: string[]; isCreator: boolean; isPersonal: boolean;}) {
    const { 
        supabase,
        user, 
        accountData, 
        loading, 
        accessLevel, 
        hasActiveTrial,
        hasProAccess, 
        calendarUsed
    } = useUserAccount();
    const [view, setView] = useState<View>("month");
    const [date, setDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [newEvent, setNewEvent] = useState({
        title: "",
        details: "",
        date: "",
        endDate: "",
        multiDay: false,
    });
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [showEventPopup, setEventShowPopup] = useState(false);

  async function handleAddEvent() {
    if (!newEvent.title || !newEvent.date) return;

    const targetGroupId = isPersonal ? null : groupIds?.[0] ?? null;

    await createEvent(
      supabase,
      targetGroupId,
      newEvent.title,
      newEvent.details,
      newEvent.date,
      newEvent.endDate
    );

    setNewEvent({ title: "", details: "", date: "", endDate: "", multiDay: false });
    setEventShowPopup(false);
    await loadEvents();
  }

  async function loadEvents() {
    try {
      let combinedEvents: any[] = [];

      // --- Personal events ---
      if (isPersonal) {
        const personalData = await getGroupEvents(supabase, null);
        const personalMapped = await Promise.all(
          personalData.map(async (e: any) => ({
            id: e.id,
            title: e.title,
            details: e.description,
            start: new Date(e.date),
            end: new Date(e.end_date),
            isPersonal: true,
            isCreator: await isUserEventCreator(supabase, user.id, e.id),
            backgroundColor: "#0cd64fff",
            groupName: null,
          }))
        );
        combinedEvents = [...combinedEvents, ...personalMapped];

        // --- All group events for personal calendar ---
        if (groupIds && groupIds.length > 0) {
          for (const gid of groupIds) {
            const groupData = await getGroupEvents(supabase, gid);
            const groupMapped = await Promise.all(
              groupData.map(async (e: any) => {
                const groupName = await getGroupFromEvent(supabase, e.id);
                return {
                  id: e.id,
                  title: groupName ? `${groupName} - ${e.title}` : e.title,
                  details: e.description,
                  start: new Date(e.date),
                  end: new Date(e.end_date),
                  isPersonal: false,
                  isCreator: await isUserEventCreator(supabase, user.id, e.id),
                  backgroundColor: "#3b92f6ff",
                  groupName: groupName,
                };
              })
            );
            combinedEvents = [...combinedEvents, ...groupMapped];
          }
          
          // Fetch Google Calendar events
          if (accountData?.google_access_token) {
            try {
              // Check if user has an active session
              const { data: { session } } = await supabase.auth.getSession();
              console.log('Session exists:', !!session);
              console.log('User ID:', user?.id);

              const res = await fetch("/api/google/events", {
                method: "POST",
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  access_token: accountData.google_access_token,
                  refresh_token: accountData.google_refresh_token,
                }),
              });

              console.log('Response status:', res.status);
              console.log('Response ok:', res.ok);

              if (!res.ok) {
                const errorData = await res.json();
                console.error('Google events fetch error:', errorData);
                // Don't throw - just log and continue without Google events
              } else {
                const data = await res.json();
                const googleMapped = data.events.map((e: any) => ({
                  id: e.id,
                  title: e.title,
                  start: new Date(e.start),
                  end: new Date(e.end),
                  isPersonal: false,
                  isCreator: false,
                  backgroundColor: "#f4b400ff",
                  groupName: e.calendarId !== "primary" ? e.calendarId : null,
                }));

                combinedEvents = [...combinedEvents, ...googleMapped];
              }
            } catch (error) {
              console.error('Error fetching Google events:', error);
              // Continue without Google events
            }
          }
        }
      } else {
        // --- Group calendar: only first group ---
        if (groupIds && groupIds.length > 0) {
          const firstGroupId = groupIds[0];
          const groupData = await getGroupEvents(supabase, firstGroupId);
          const groupMapped = await Promise.all(
            groupData.map(async (e: any) => {
              const groupName = await getGroupFromEvent(supabase, e.id);
              return {
                id: e.id,
                title: e.title,
                details: e.description,
                start: new Date(e.date),
                end: new Date(e.end_date),
                isPersonal: false,
                isCreator: await isUserEventCreator(supabase, user.id, e.id),
                backgroundColor: "#3b92f6ff",
                groupName: groupName,
              };
            })
          );
          combinedEvents = [...combinedEvents, ...groupMapped];
        }
      }

      setEvents(combinedEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  }

  useEffect(() => {
    if (accountData && !loading) loadEvents();
  }, [groupIds, accountData, loading]);

  const handleNavigate = (newDate: Date) => setDate(newDate);
  const handleViewChange = (newView: View) => setView(newView);
  const toggleEventShowPopup = () => setEventShowPopup(!showEventPopup);

  function checkValidEndDateTime(startDate: string, endDate: string): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    return start < end;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="d-flex">
                  <h1 className="text-3xl font-bold">Calendar</h1>
                  {(isCreator || isPersonal) && (
                    <button
                      onClick={toggleEventShowPopup}
                      className="btn btn-outline-primary m-2"
                    >
                      Add Event
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                view={view}
                onView={handleViewChange}
                date={date}
                onNavigate={handleNavigate}
                onSelectEvent={(event) => {
                    setSelectedEvent(event);
                    setShowPopup(true);
                }}
                eventPropGetter={(event) => {
                    const backgroundColor = event.backgroundColor;
                    return { style: { backgroundColor, color: "black" } };
                }}
            />
          </div>
        </div>

        {(isCreator || isPersonal) && (
          <Modal show={showEventPopup} onHide={toggleEventShowPopup} centered>
            <Modal.Header>
              <h4 className="text-center text-gradient">
                Create new {isPersonal ? "Personal" : "Group"} Event
              </h4>
              <button
                onClick={toggleEventShowPopup}
                className="btn btn-outline-danger"
              >
                <i className="bi bi-x-circle"></i>
              </button>
            </Modal.Header>
            <Modal.Body>
              <EventInput
                onChange={(title, details, date, endDate, multiDay) =>
                  setNewEvent({ title, details, date, endDate, multiDay })
                }
              />
              {checkValidEndDateTime(newEvent.date, newEvent.endDate) && (
                <button onClick={handleAddEvent} className="btn btn-outline-primary">
                  Add
                </button>
              )}
            </Modal.Body>
          </Modal>
        )}

        <EventPopup
          show={showPopup}
          onClose={() => setShowPopup(false)}
          loadEvents={loadEvents}
          event={selectedEvent}
          isCreator={selectedEvent ? selectedEvent.isCreator : false}
          supabase={supabase}
          isPersonal={selectedEvent ? selectedEvent.isPersonal : false}
        />
      </div>
    </div>
  );
}