"use client";

import { deleteEvent, Event, getGroupFromEvent, updateEvent } from "@/lib/groupEvents";
import { SupabaseClient } from "@supabase/supabase-js";
import React, { useState } from "react";
import { createNotif, getGroupNotifications } from "@/lib/notifications";
import { Modal, Button, Form } from "react-bootstrap";
import EventInput from "./EventInput";
import { checkValidEndDateTime } from "./EventsCalendar";

interface EventPopupProps {
  show: boolean;
  onClose: () => void;
  event: Event | undefined;
  isCreator: boolean;
  supabase: SupabaseClient;
  groupIds: string[];
  isPersonal: boolean;
  isGoogle: boolean;
}

export default function EventPopup({ show, onClose, event, isCreator, supabase, groupIds, isPersonal = false, isGoogle = false}: EventPopupProps) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [showNotifyPopup, setShowNotifyPopup] = useState(false);
  const [notificationDetails, setNotificationDetails] = useState("");
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editEvent, setEditEvent] = useState({
    title: "",
    details: "",
    date: new Date(),
    endDate: new Date(),
    multiDay: false,
    dateString: "",
    endDateString: "",
  });

  React.useEffect(() => {
    if (event && showEditPopup) {
      const date = new Date(event.start);
      const endDate = new Date(event.end);
      const startLocalDate = date.toLocaleDateString("en-CA", { timeZone: timezone });
      const endLocalDate = endDate.toLocaleDateString("en-CA", { timeZone: timezone });
      const isMultiDay = startLocalDate !== endLocalDate;
      
      setEditEvent({
        title: event.title,
        details: event.description,
        date: event.start,
        endDate: event.end,
        multiDay: isMultiDay,
        dateString: event.start.toISOString(),
        endDateString: event.end.toISOString(),
      });
    }
  }, [event, showEditPopup, timezone]);

  if (!event || event === undefined) return null;

  // Format dates/times
  const date = new Date(event.start);
  const endDate = new Date(event.end);
  const dateString = date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });
  const endDateString = endDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });
  const timeString = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const endTimeString = endDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  const startLocalDate = date.toLocaleDateString("en-CA", { timeZone: timezone });
  const endLocalDate = endDate.toLocaleDateString("en-CA", { timeZone: timezone });

  // Multi-day = true if the dates differ
  const isMultiDay = startLocalDate !== endLocalDate;

  async function handleDeleteEvent() {
    if (!event) return;
    await deleteEvent(supabase, event.id);
    window.location.reload();
    onClose();
  }

  async function notifyAbsence() {
    if (!event) return;
    const group = await getGroupFromEvent(supabase, event.id);
    console.log("Group", group);
    await createNotif(supabase, group, event, "absent");
    await getGroupNotifications(supabase, groupIds);
    onClose();
  }

  async function notifyGroup(details: string) {
    if (!event) return;
    const group = await getGroupFromEvent(supabase, event.id);
    await createNotif(supabase, group, event, "group_alert", details);
    await getGroupNotifications(supabase, groupIds);
  }

  function openNotifyEventPopup() {
    setShowNotifyPopup(true);
    onClose(); // close main popup
  }

  function openEditPopup() {
    if (event === undefined) return;
    setShowEditPopup(true);
    onClose(); // close main popup
  }

  async function handleEditEvent() {
    await updateEvent(supabase, event?.id, editEvent.title, editEvent.details, editEvent.dateString, editEvent.endDateString);
    setShowEditPopup(false);
  }

  async function handleSendNotification() {
    if (!notificationDetails.trim()) return;
    await notifyGroup(notificationDetails);
    setNotificationDetails("");
    setShowNotifyPopup(false);
  }

  return (
    <>
      {/* Main Event Popup */}
      <Modal show={show} onHide={onClose} centered>
        <Modal.Header>
          <Modal.Title className="text-gradient">{isPersonal && event.groupName ? `${event.groupName} - ` : ""}{event.title}</Modal.Title>
          <button onClick={onClose} className="btn btn-outline-danger">
            <i className="bi bi-x-circle"></i>
          </button>
        </Modal.Header>

        <Modal.Body>
          <p><strong className="text-primary">Date:</strong> {dateString}</p>
          {dateString !== endDateString && (
            <p><strong className="text-primary">End Date:</strong> {endDateString}</p>
          )}
          <p><strong className="text-primary">Start Time:</strong> {timeString}</p>
          <p><strong className="text-primary">End Time:</strong> {endTimeString}</p>
          <hr />
          <p>{event.description || "No description provided."}</p>
        </Modal.Body>

        <Modal.Footer>
          {!isPersonal && (
            <>
              {isCreator && (
                <Button variant="outline-primary" onClick={openNotifyEventPopup}>
                  Alert Group
                </Button>
              )}
              {!isGoogle && (
                <Button variant="outline-warning" onClick={notifyAbsence}>
                  Notify Absence
                </Button>
              )}
            </>
          )}

          {(isCreator || isPersonal) && (
            <>
              <Button variant="btn btn-outline-secondary" onClick={openEditPopup}>
                Edit
              </Button>
              <Button variant="btn btn-outline-danger" onClick={handleDeleteEvent}>
                Delete
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* Creator-only Notify Group Popup */}
      <Modal show={showNotifyPopup} onHide={() => setShowNotifyPopup(false)} centered>
        <Modal.Header>
          <Modal.Title>Create Group Notification</Modal.Title>
          <button
            onClick={() => setShowNotifyPopup(false)}
            className="btn btn-outline-danger"
          >
            <i className="bi bi-x-circle"></i>
          </button>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Notification Details</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter notification details..."
                value={notificationDetails}
                onChange={(e) => setNotificationDetails(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="btn btn-outline-primary"
            onClick={handleSendNotification}
            disabled={!notificationDetails.trim()}
          >
            Send Notification
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Creator-only Edit Event Popup */}
      <Modal show={showEditPopup} onHide={() => setShowEditPopup(!showEditPopup)} centered>
        <Modal.Header>
          <h4 className="text-center text-gradient">
            Edit {isPersonal ? "Personal" : "Group"} Event
          </h4>
          <button
            onClick={() => setShowEditPopup(!showEditPopup)}
            className="btn btn-outline-danger"
          >
            <i className="bi bi-x-circle"></i>
          </button>
        </Modal.Header>
        <Modal.Body>
          <EventInput
            onChange={(title, details, date, endDate, multiDay) => setEditEvent({ title, details, date: new Date(date), endDate: new Date(endDate), multiDay, dateString: date, endDateString: endDate })}
            initial={{
              title: event.title,
              description: event.description,
              time: event.start.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone }),
              endTime: event.end.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone }),
              date: event.start.toLocaleDateString('en-CA', { timeZone: timezone }),
              endDate: isMultiDay ? event.end.toLocaleDateString('en-CA', { timeZone: timezone }) : "",
              multiDay: isMultiDay
            }}/>
          {checkValidEndDateTime(editEvent.dateString, editEvent.endDateString, isMultiDay) && (
            <button onClick={handleEditEvent} className="btn btn-outline-primary">
              Save
            </button>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
