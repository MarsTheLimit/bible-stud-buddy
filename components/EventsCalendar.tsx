"use client";
import { useState, useEffect } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { createEvent, Event, loadEvents, loadGoogleEvents } from "@/lib/groupEvents";
import EventInput from "./EventInput";
import EventPopup from "./EventPopup";
import { useUserAccount } from "@/lib/hooks/useUserAccount";

const locales: Record<string, unknown> = {
  "en-US": enUS,
};

export function checkValidEndDateTime(startDate: string, endDate: string, isMultiDay: boolean): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  
  if (isMultiDay) {
    // For multi-day: compare dates only (ignore time)
    const startDateOnly = start.toISOString().split('T')[0];
    const endDateOnly = end.toISOString().split('T')[0];
    return startDateOnly! < endDateOnly!;
  }
  
  // For single-day: compare full datetime (start time must be earlier than end time)
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

const LoadingGoogleSpinner = () => (
  <div className="text-center py-5">
    <Spinner animation="border" role="status" variant="primary" className="mb-3">
      <span className="visually-hidden">Loading...</span>
    </Spinner>
    <p className="text-muted">Loading google calendar events...</p>
  </div>
);

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

export default function EventsCalendar({ groupIds, isCreator, isPersonal, onEventAdded }: { groupIds: string[]; isCreator: boolean; isPersonal: boolean; onEventAdded?: () => void; }) {
    const { 
        supabase,
        user, 
        accountData, 
        loading,
        hasProAccess,
        calendarUsed,
    } = useUserAccount();
    const [view, setView] = useState<View>("month");
    const [date, setDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [googleEvents, setGoogleEvents] = useState<Event[]>([]);
    const [showGoogleEvents, setShowGoogleEvents] = useState(true);
    const [newEvent, setNewEvent] = useState({
        title: "",
        details: "",
        date: "",
        endDate: "",
        multiDay: false,
    });
    const [selectedEvent, setSelectedEvent] = useState<Event>();
    const [showPopup, setShowPopup] = useState(false);
    const [showEventPopup, setEventShowPopup] = useState(false);

    const [syncMsg, setSyncMsg] = useState("Sync Now")

    const [loadingEvents, setLoadingEvents] = useState(false)
    const [loadingGoogleEvents, setLoadingGoogleEvents] = useState(false)

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
    setEvents(await loadEvents(supabase, isPersonal, user, groupIds));
    if (isPersonal) setGoogleEvents(await loadGoogleEvents(accountData, false));
    
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
      setEvents(await loadEvents(supabase, isPersonal, user, groupIds));
      setLoadingEvents(false);
      if (isPersonal) {
        setLoadingGoogleEvents(true);
        setGoogleEvents(await loadGoogleEvents(accountData, false));
        setLoadingGoogleEvents(false);
      }
  };

  if (accountData && !loading) {
    fetchEvents();
  }
}, [groupIds, accountData, loading, supabase, isPersonal, user, hasProAccess]);

  const handleNavigate = (newDate: Date) => setDate(newDate);
  const handleViewChange = (newView: View) => setView(newView);
  const toggleEventShowPopup = () => setEventShowPopup(!showEventPopup);

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
            {loadingEvents && (<LoadingSpinner />)}
            {loadingGoogleEvents && (<LoadingGoogleSpinner />)}
            { (!loadingEvents && !loadingGoogleEvents) && (
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
                eventPropGetter={(event : Event) => {
                    const backgroundColor = event.backgroundColor;
                    return { style: { backgroundColor, color: "black" } };
                }}
              />
            )}
          </div>

          { (isPersonal && hasProAccess && !loadingEvents && calendarUsed.includes("google")) && (<div className="mt-2 p-2">
            <h2>Data Syncing to Calendars</h2>
            <p className="fw-light">Adds all events from this app to a new calendar in your calendar app</p>
            <Form>
              <Button
                type="button"
                id="sync-personal"
                onClick={async () => {
                    const res = await fetch("/api/google/sync", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        calendarName: "Bible Studdy Buddy Events",
                        events: events,
                      }),
                    });

                    const data = await res.json();
                    if (data.success) setSyncMsg("Events synced!");
                    else setSyncMsg("Syncing Error");
                }}
              >{syncMsg}</Button>
            </Form>
            <p className="text-muted small mt-3">
              By clicking this button, you allow this app to create a new calendar in your Google Calendar and add your Bible Study Buddy events to it. 
              Your Google data is used only to sync and display your events and is never shared with third parties. 
              <a href="/privacy-policy" rel="noopener noreferrer" className="text-primary underline">
                Privacy Policy
              </a>.
            </p>
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
                onChange={(title, details, date, endDate, multiDay) => setNewEvent({ title, details, date, endDate, multiDay })}
                initial={{
                  title: "",
                  description: "",
                  time: "",
                  endTime: "",
                  date: "",
                  endDate: "",
                  multiDay: false
                }}              />
              {checkValidEndDateTime(newEvent.date, newEvent.endDate, newEvent.multiDay) && (
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
          groupIds={groupIds}
          isPersonal={selectedEvent ? selectedEvent.isPersonal : false}
          isGoogle={selectedEvent ? selectedEvent.isGoogleEvent : false}
        />
      </div>
    </div>
  );
}