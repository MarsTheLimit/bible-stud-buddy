"use client";
import { useState, useEffect } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { createEvent, loadEvents } from "@/lib/groupEvents";
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

export default function EventsCalendar({
  groupIds,
  isCreator,
  isPersonal,
  onEventAdded
}: {
  groupIds: string[];
  isCreator: boolean;
  isPersonal: boolean;
  onEventAdded?: () => void;
}) {
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
    const [googleEvents, setGoogleEvents] = useState<any[]>([]);
    const [showGoogleEvents, setShowGoogleEvents] = useState(true);
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

    const [loadingEvents, setLoadingEvents] = useState(false)

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
    await loadEvents(supabase, isPersonal, user, groupIds, accountData, setGoogleEvents, setEvents);
    
    // Call the callback if provided
    if (onEventAdded) {
      onEventAdded();
    }
  }

  // Combine events based on toggle
  const displayedEvents = showGoogleEvents 
    ? [...events, ...googleEvents] 
    : events;

  useEffect(() => {
  const fetchEvents = async () => {
    setLoadingEvents(true);
    await loadEvents(supabase, isPersonal, user, groupIds, accountData, setGoogleEvents, setEvents, null, hasProAccess);
    setLoadingEvents(false);
  };

  if (accountData && !loading) {
    fetchEvents();
  }
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

  const LoadingSpinner = () => (
    <div className="text-center py-5">
      <Spinner animation="border" role="status" variant="primary" className="mb-3">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="text-muted">Loading calendar events...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="d-flex align-items-center">
                  <h1 className="text-3xl font-bold">Calendar</h1>
                  {(isCreator || isPersonal) && !loadingEvents && (
                    <button
                      onClick={toggleEventShowPopup}
                      className="btn btn-outline-primary m-2"
                    >
                      Add Event
                    </button>
                  )}
                </div>
              </div>
              
              {/* Google Calendar Toggle */}
              {isPersonal && accountData?.google_access_token && googleEvents.length > 0 && !loadingEvents && hasProAccess && (
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="googleCalendarToggle"
                    checked={showGoogleEvents}
                    onChange={(e) => setShowGoogleEvents(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label 
                    className="form-check-label text-dark" 
                    htmlFor="googleCalendarToggle"
                    style={{ cursor: 'pointer' }}
                  >
                    Show Google Calendar Events
                  </label>
                </div>
              )}
            </div>
          </div>
          <div className="p-6">
            {loadingEvents ? (
              <LoadingSpinner />
            ) : (
              <Calendar
                localizer={localizer}
                events={displayedEvents}
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
            )}
          </div>

          { (isPersonal && hasProAccess && !loadingEvents) && (<div className="mt-2 p-2">
            <h2>Data Syncing to Calendars</h2>
            <p className="fw-light">Adds all events from this app to a new calendar in your calendar app</p>
            <Form>
              <Button
                type="button"
                id="sync-personal"
                onClick={async (e) => {
                    const res = await fetch("/api/google/sync", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        calendarName: "Bible Studdy Buddy Events",
                        events: events,
                      }),
                    });

                    const data = await res.json();
                    // if (data.success) alert("Events synced!");
                    // else alert("Failed to sync personal events");
                }}
              >Sync now</Button>
            </Form>
          </div>)}
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
          event={selectedEvent}
          isCreator={selectedEvent ? selectedEvent.isCreator : false}
          supabase={supabase}
          isPersonal={selectedEvent ? selectedEvent.isPersonal : false}
        />
      </div>
    </div>
  );
}