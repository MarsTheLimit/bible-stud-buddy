"use client";

import { deleteEvent, getGroupFromEvent } from "@/lib/groupEvents";
import { SupabaseClient } from "@supabase/supabase-js";
import React, { useState } from "react";
import { createNotif } from "@/lib/notifications";
import { Modal, Button, Form } from "react-bootstrap";

interface EventPopupProps {
  show: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    details?: string;
    start: string;
    end: string;
    group?: string | null;
    isPersonal?: boolean;
    groupName?: string | null;
  };
  isCreator: boolean;
  supabase: SupabaseClient;
  isPersonal: boolean;
}

export default function EventPopup({ show, onClose, event, isCreator, supabase, isPersonal = false, }: EventPopupProps) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [showNotifyPopup, setShowNotifyPopup] = useState(false);
  const [notificationDetails, setNotificationDetails] = useState("");

  if (!event) return null;

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

  async function handleDeleteEvent() {
    await deleteEvent(supabase, event.id);
    window.location.reload();
    onClose();
  }

  async function notifyAbsence() {
    const group = await getGroupFromEvent(supabase, event.id);
    console.log("Group", group);
    await createNotif(supabase, group, event, "absent");
    onClose();
  }

  async function notifyGroup(details: string) {
    const group = await getGroupFromEvent(supabase, event.id);
    console.log("Group", group);
    await createNotif(supabase, group, event, "group_alert", details);
  }

  function openNotifyEventPopup() {
    setShowNotifyPopup(true);
    onClose(); // close main popup
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
          <p>{event.details || "No description provided."}</p>
        </Modal.Body>

        <Modal.Footer>
          {!isPersonal && (
            <>
              {isCreator && (
                <Button variant="outline-primary" onClick={openNotifyEventPopup}>
                  Alert Group
                </Button>
              )}
              <Button variant="outline-warning" onClick={notifyAbsence}>
                Notify Absence
              </Button>
            </>
          )}

          {(isCreator || isPersonal) && (
            <Button variant="btn btn-outline-danger" onClick={handleDeleteEvent}>
              Delete Event
            </Button>
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
    </>
  );
}
