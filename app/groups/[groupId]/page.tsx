"use client";

import { useSupabase } from "@/components/SupabaseProvider";
import EventsCalendar from "@/components/EventsCalendar";
import { use, useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import { createNotif } from "@/lib/notifications";
import NotificationViewer from "@/components/NotificationViewer";

interface Group {
  id: string;
  name: string;
  join_code: string;
  created_by: string;
}

interface User {
  id: string;
  email: string;
  created_at: string;
}

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const { supabase } = useSupabase();
  const [group, setGroup] = useState<Group | null>(null);
  // const [creatorEmail, setCreatorEmail] = useState<string>("Unknown");
  const [loading, setLoading] = useState(true);
  const [usersInGroup, setUsersInGroup] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Prayer modal states
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [prayerAnonymous, setPrayerAnonymous] = useState(false);
  const [prayerDetails, setPrayerDetails] = useState("");

  useEffect(() => {
    async function fetchGroup() {
      setLoading(true);
      try {
        const { data: groupData, error: groupError } = await supabase
          .from("groups")
          .select("*")
          .eq("id", groupId)
          .maybeSingle();

        if (groupError || !groupData) {
          console.error("Group not found or error:", groupError);
          setLoading(false);
          return;
        }

        setGroup(groupData);

        // const { data: profileData } = await supabase
        //   .from("profiles")
        //   .select("email")
        //   .eq("id", groupData.created_by)
        //   .single();

        // setCreatorEmail(profileData?.email ?? "Unknown");

        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser) {
          setCurrentUser({
            id: supabaseUser.id,
            email: supabaseUser.email || "",
            created_at: supabaseUser.created_at,
          });
        }

        const res = await fetch(`/api/groupMembers?groupId=${groupId}`);
        const { users } = await res.json();
        setUsersInGroup(users);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchGroup();
  }, [groupId, supabase]);

  async function handlePrayerSubmit() {
    try {
        const groupInfo = {
        group_id: groupId,
        name: group?.name || "Unnamed Group",
        creator_id: group?.created_by,
        };

        const notif = await createNotif(
        supabase,
        groupInfo,
        null,
        "prayer_req",
        prayerDetails,
        prayerAnonymous
        );

        if (notif) {
        console.log("Prayer notification created:", notif);
        setShowPrayerModal(false);
        setPrayerAnonymous(false);
        setPrayerDetails("");
        } else {
        console.warn("Failed to create prayer notification");
        }
    } catch (error) {
        console.error("Error submitting prayer request:", error);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!group) return <p>Group not found.</p>;

  return (
    <div className="container py-5">
      <div className="bg-gradient rounded-2 p-5 shadow">
        <div className="text-center text-gradient p-2">
          <h1>{group.name}&apos;s Page</h1>
        </div>

        <div className="row justify-content-center text-center mb-4">
          <div className="col-auto mb-4 mb-md-0">
            {group.created_by === currentUser?.id && (
              <span className="badge bg-primary rounded-pill fw-light">
                Join Code: {group.join_code}
              </span>
            )}
          </div>
          <div className="col-auto mb-4 mb-md-0">
            {usersInGroup.length > 0 ? (
              <span className="badge bg-primary rounded-pill fw-light">
                Members: {usersInGroup.map(u => u.email).join(", ")}
              </span>
            ) : (
              "No members yet"
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="text-center mb-4">
          <Button variant="outline-primary" onClick={() => setShowPrayerModal(true)}>
            <i className="bi bi-heart-fill me-2"></i> Add Prayer Request
          </Button>
        </div>

        {/* Calendar */}
        <div>
          <EventsCalendar groupIds={[groupId]} isCreator={group.created_by === currentUser?.id} isPersonal={false} /><br/>
          <h2>Notifications</h2>
          <NotificationViewer groupIds={[groupId]}/>
        </div>
      </div>

      {/* Prayer Request Modal */}
      <Modal show={showPrayerModal} onHide={() => setShowPrayerModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Prayer Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Would you like to include your name?</Form.Label>
              <Form.Check
                    type="checkbox"
                    label="Submit anonymously"
                    checked={prayerAnonymous}
                    onChange={(e) => setPrayerAnonymous(e.target.checked)}
                />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Details</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Write more details here..."
                value={prayerDetails}
                onChange={(e) => setPrayerDetails(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowPrayerModal(false)}>
            Cancel
          </Button>
          <Button variant="outline-primary" onClick={handlePrayerSubmit}>
            Submit Prayer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
