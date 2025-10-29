"use client";

import { useUserAccount } from "@/lib/hooks/useUserAccount";
import { getGroupNotifications, isUserGroupOwner } from "@/lib/notifications";
import { useEffect, useState } from "react";
import { Card, Spinner, Button } from "react-bootstrap";

// --- Helper to delete notification ---
async function deleteNotification(supabase: any, id: number) {
  const { error } = await supabase.from("user_messages").delete().eq("id", id);
  if (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}

interface Notification {
  id: number;
  created_at: string;
  msg_type: "absent" | "prayer_req" | "group_alert";
  msg_content: {
    title: string;
    content: string;
    datetime_sent: string;
    sender?: string;
    event?: {
      id: string;
      name?: string;
      date?: string;
    };
  };
  sender: string;
  recipient: string; // group id
}

export default function NotificationViewer({ groupIds }: { groupIds: string[] }) {
  const { supabase, user, loading } = useUserAccount();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (!groupIds || groupIds.length === 0) return;
    fetchNotifications();
  }, [groupIds]);

  async function fetchNotifications() {
    const notifications = await getGroupNotifications(supabase, groupIds);
    setNotifications(notifications);
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      await deleteNotification(supabase, id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  }

  if (loading)
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  if (!notifications.length)
    return <p className="text-center text-muted mt-4">No notifications yet.</p>;

  return (
    <div className="space-y-4 p-4">
      {notifications.map((notif) => (
        <NotificationCardWrapper
          key={notif.id}
          notif={notif}
          userId={user?.id}
          supabase={supabase}
          onDelete={handleDelete}
          deleting={deleting === notif.id}
        />
      ))}
    </div>
  );
}

// Wrapper to handle ownership check asynchronously
function NotificationCardWrapper({
  notif,
  userId,
  supabase,
  onDelete,
  deleting,
}: {
  notif: Notification;
  userId?: string;
  supabase: any;
  onDelete: (id: number) => void;
  deleting: boolean;
}) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function checkOwner() {
      if (!userId) return;
      const owner = await isUserGroupOwner(supabase, userId, notif.recipient);
      setIsOwner(owner);
    }
    checkOwner();
  }, [notif, userId, supabase]);

  const canDelete = userId === notif.sender || isOwner;

  return (
    <NotificationCard
      notif={notif}
      canDelete={canDelete}
      onDelete={() => onDelete(notif.id)}
      deleting={deleting}
    />
  );
}

function NotificationCard({
  notif,
  canDelete,
  onDelete,
  deleting,
}: {
  notif: Notification;
  canDelete: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { msg_type, msg_content } = notif;
  const date = new Date(msg_content.datetime_sent).toLocaleString();
  const eventDate =
    msg_type === "group_alert" && msg_content.event?.date
      ? new Date(msg_content.event.date).toLocaleString()
      : "";

  let border = "";
  let headerBg = "";
  let textColor = "text-dark";

  switch (msg_type) {
    case "group_alert":
      border = "border-success";
      headerBg = "bg-success text-light";
      break;
    case "prayer_req":
      border = "border-primary";
      headerBg = "bg-primary text-white";
      break;
    case "absent":
      border = "border-warning";
      headerBg = "bg-warning text-white";
      break;
    default:
      border = "border-secondary";
      headerBg = "bg-light";
  }

  return (
    <div className={`card shadow-sm mb-3 ${border}`}>
      <div className={`card-header d-flex justify-content-between align-items-center ${headerBg}`}>
        <div>
          <strong className="text-uppercase">{msg_type.replace("_", " ")}</strong>
          <span className="ms-2 small">{date}</span>
        </div>

        {canDelete && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="btn btn-sm btn-outline-light"
            style={{ fontWeight: "bold", lineHeight: "1" }}
          >
            {deleting ? "…" : "×"}
          </button>
        )}
      </div>

      <div className={`card-body ${textColor}`}>
        <h5 className="card-title">{msg_content.title || "No Title"}</h5>

        {msg_type === "group_alert" && msg_content.event ? (
          <p className="card-text">
            <strong>Group Alert:</strong> {msg_content.content}
            <br />
            <strong>Event:</strong> {msg_content.event.name ?? "Unknown"} on {eventDate || "TBA"}
          </p>
        ) : msg_type === "prayer_req" ? (
          <p className="card-text">
            <strong>Prayer Request:</strong> {msg_content.content}
          </p>
        ) : msg_type === "absent" ? (
          <p className="card-text">
            <strong>Absence Notice:</strong> {msg_content.content}
          </p>
        ) : (
          <p className="card-text">{msg_content.content}</p>
        )}
      </div>
    </div>
  );
}
