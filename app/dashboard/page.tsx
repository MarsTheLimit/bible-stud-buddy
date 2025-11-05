"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserGroups } from "@/lib/group";
import Link from "next/link";
import { useUserAccount } from "@/lib/hooks/useUserAccount";
import { loadEvents } from "@/lib/groupEvents";

import NotificationViewer from "@/components/NotificationViewer";
import EventsCalendar from "@/components/EventsCalendar";
import ProPill from "@/components/ProPill";
import { supabase } from "@/lib/supabaseClient";
import { Form, Row, Col, Button, Spinner } from "react-bootstrap";
import { PreferencesPopup } from "@/components/PreferencesPopup";
import CreateStudyPlan from "@/components/CreateStudyPlan";
import PlannerViewer from "@/components/PlannerViewer";

interface UserGroup {
  id: string;
  name: string;
  created_by: string;
  isCreator: boolean;
  join_code: string;
  user_count: number;
}

interface Preferences {
  morning_person: boolean;
  busyness: string;
  least_busy_days: string[] | null;
  school_work: { type: string; hours: string } | null;
  earliest_awake: string | null;
  latest_asleep: string | null;
  other_info: string | null;
}

export default function Dashboard() {
  const {
    updateAccount,
    supabase,
    user, 
    accountData, 
    loading,
    hasProAccess,
    calendarUsed,
    schedulePrefs,
    planners,
    refresh
  } = useUserAccount();
  const router = useRouter();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'calendar' | 'chat' | 'groups'>('alerts');
  const [events, setEvents] = useState<unknown[]>([]);
  const [calendarKey, setCalendarKey] = useState(0); // Key to force remount calendar

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Fetch groups
  useEffect(() => {
    if (!loading && user) {
      async function fetchGroups() {
        setFetching(true);
        try {
          const userGroups = await getUserGroups(supabase);
          
          for (const element of userGroups) {
            const res = await fetch(`/api/groupMembers?groupId=${element.id}`);
            const { users } = await res.json();
            element.user_count = users.length;
          }

          setGroups(userGroups);
        } catch (error) {
          console.error("Failed to fetch groups:", error);
        } finally {
          setFetching(false);
        }
      }
      fetchGroups();
    }
  }, [user, loading, supabase]);

  useEffect(() => {
    if (groups.length > 0) {
      const ids = groups.map((group) => group.id);
      setGroupIds(ids);
    }
  }, [groups]);

  const isLoading = loading || fetching;
  
  if (!loading && !user) return null;

  const LoadingSpinner = ({ text }: { text: string }) => (
    <div className="text-center py-5">
      <Spinner animation="border" role="status" variant="primary" className="mb-3">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="text-muted">{text}</p>
    </div>
  );

  const GroupsContent = () => (
    <div>
      {isLoading ? (
        <LoadingSpinner text="Loading groups..." />
      ) : groups.length === 0 ? (
        <p className="text-center text-muted">You are not in any groups.</p>
      ) : (
        <div className="list-group">
          {groups.map((group) => (
            <div key={group.id} className="card m-2 p-2">
              <div className="d-flex justify-content-between align-items-center flex-wrap">
                <Link
                  href={`/groups/${group.id}`}
                  className="text-decoration-none"
                >
                  <h3 className="h5 text-primary mb-0">{group.name}</h3>
                </Link>
                <div className="d-flex align-items-center flex-wrap gap-1">
                  <span className="badge rounded-pill fw-light bg-success">
                    {group.user_count} Users
                  </span>

                  {group.isCreator && (
                    <>
                      <span className="badge rounded-pill fw-light bg-primary bg-gradient">
                        Creator
                      </span>
                      <span className="badge rounded-pill fw-light bg-secondary">
                        {group.join_code}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  async function handleUpdateUserPreferences() {
    try {
      await updateAccount({ schedule_prefs: null });
      await refresh();
    } catch (error) {
      console.error("Failed to reset preferences:", error);
      alert("An error occurred while resetting your preferences.");
    }
  }

  // Callback to refresh calendar when events are added
  const handleCalendarRefresh = () => {
    setCalendarKey(prev => prev + 1);
  };

  return (
    <div className="container px-5 my-5">
      <header className="text-center mb-5">
        <h1 className="display-5 fw-bolder mb-0">
          <span className="text-gradient d-inline">Dashboard</span>
        </h1>
      </header>

      <div className="row">
        {/* Main Content - Takes up 8 columns on large screens, full width on small */}
        <section className="col-lg-8 mb-4">
          <div className="card overflow-hidden shadow rounded-4 border-0">
            <div className="card-body">
              {/* Tab Navigation */}
              <ul className="nav nav-tabs mb-4" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'alerts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('alerts')}
                    type="button"
                    role="tab"
                  >
                    Notifications
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'calendar' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calendar')}
                    type="button"
                    role="tab"
                  >
                    Calendar
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link d-flex ${activeTab === 'chat' ? 'active' : ''} ${!hasProAccess ? 'text-muted' : ''}`}
                    onClick={() => setActiveTab('chat')}
                    type="button"
                    role="tab"
                    disabled={!hasProAccess && !isLoading}
                  >
                    AI Planner{ !hasProAccess && !isLoading && (
                      <a href="/pricing"><div className="m-1 my-0"><ProPill accessLevel="pro" hasActiveTrial={false} /></div></a>
                      
                    )}
                  </button>
                </li>
                {/* Groups tab only visible on small screens */}
                <li className="nav-item d-lg-none" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'groups' ? 'active' : ''}`}
                    onClick={() => setActiveTab('groups')}
                    type="button"
                    role="tab"
                  >
                    Groups
                  </button>
                </li>
              </ul>

              {/* Tab Content */}
              <div className="tab-content">
                {/* Alerts Section */}
                {activeTab === 'alerts' && (
                  <section className="tab-pane fade show active">
                    <h4>Notifications</h4>
                    {isLoading ? (
                      <LoadingSpinner text="Loading notifications..." />
                    ) : (
                      <NotificationViewer groupIds={groupIds}/>
                    )}
                  </section>
                )}

                {/* Personal Calendar Section */}
                {activeTab === 'calendar' && (
                  <section className="tab-pane fade show active">
                    <h4>Personal Calendar</h4>
                    {isLoading ? (
                      <LoadingSpinner text="Loading calendar..." />
                    ) : (
                      <EventsCalendar 
                        key={calendarKey}
                        groupIds={groupIds} 
                        isCreator={false} 
                        isPersonal={true}
                        onEventAdded={handleCalendarRefresh}
                      />
                    )}
                  </section>
                )}

                {/* AI Chat Section */}
                {activeTab === 'chat' && (
                  <section className="tab-pane fade show active">
                    <div className="" style={{minHeight: '50vh'}}>
                      {isLoading ? (
                        <LoadingSpinner text="Loading AI Planner..." />
                      ) : (
                        <>
                          <span className="d-flex">
                            { calendarUsed.includes("google") ? (
                              <span className="fw-light fs-5 text-secondary">(Using Google Calendar)</span>
                            ) : (
                              <h2 className="fs-5 text-secondary">No Calendar Connected</h2>
                            )}
                            { schedulePrefs && (<PreferencesPopup onEdit={handleUpdateUserPreferences}/>) }
                          </span>
                          { !calendarUsed.includes("google") ? (
                            <>
                              <div className="d-flex align-items-center justify-content-center text-center my-xl-5">
                                <button className="btn btn-primary my-xl-5" onClick={connectGoogle}>Connect Google Calendar</button>
                              </div>
                              <p className="mt-auto text-muted small">
                                By clicking this button, you allow this app to view your Google Calendar events to display your schedule. 
                                If you create a Bible study plan with AI, your data is used only to personalize your plan and is never shared with third parties. 
                                <a href="/privacy-policy" rel="noopener noreferrer" className="text-primary underline">
                                  Privacy Policy
                                </a>.
                              </p>
                            </>
                          ) : (
                            <>
                              {((accountData?.tokens_left ?? 0) >= 2000) ? (<span>You can make about {Math.ceil((accountData?.tokens_left ?? 0) / 5000)} new planners this month</span>):
                              (
                                <span>You can&apos;t make any new planners this month</span>
                              )}
                              { (schedulePrefs === null) ? (
                                <PreferencesInput onSubmit={async (prefs) => {
                                  try {
                                    await updateAccount({ schedule_prefs: prefs });
                                    console.log("Preferences saved to Supabase:", prefs);
                                  } catch (err) {
                                    console.error("Failed to update preferences:", err);
                                  }
                                }} />
                              ) : (
                                <div className="m-2 p-1">
                                  {((planners?.length ?? 0) === 0) ? (
                                    <CreateStudyPlan
                                      schedulePrefs={schedulePrefs}
                                      userEvents={events}
                                      onSubmit={async () => {
                                        const oneMonthFromNow = new Date();
                                        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
                                        setEvents(await loadEvents(supabase, true, user, groupIds, oneMonthFromNow));
                                        console.log("Returning: ", events);
                                        return events;
                                      }}
                                      tokensLeft={(accountData?.tokens_left ?? 0)}
                                    />
                                  ) : (
                                    <PlannerViewer
                                      userId={user?.id}
                                    />
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </section>
                )}

                {/* Groups Section - Only shows as tab on small screens */}
                {activeTab === 'groups' && (
                  <section className="tab-pane fade show active d-lg-none">
                    <h4>Your Groups</h4>
                    <GroupsContent />
                  </section>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Groups Sidebar - Only visible on large screens */}
        <aside className="col-lg-4 mb-4 d-none d-lg-block">
          <div className="card overflow-hidden shadow rounded-4 border-0 sticky-top" style={{ top: '20px' }}>
            <div className="card-header">
              <h2 className="h3 mb-0">Your Groups</h2>
            </div>
            <div className="card-body p-0">
              <GroupsContent />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PreferencesInput({
  onSubmit,
}: {
  onSubmit: (prefs: Preferences) => void;
}) {
  const [prefs, setPrefs] = useState<Preferences>({
    morning_person: false,
    busyness: "",
    least_busy_days: [], 
    school_work: { type: "", hours: "" },
    earliest_awake: null,
    latest_asleep: null,
    other_info: null,
  });

  const handleChange = (field: keyof Preferences, value: unknown) => {
    const updated = { ...prefs, [field]: value };
    setPrefs(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(prefs);
  };

  return (
    <Form className="p-3 border rounded bg-light shadow-sm" onSubmit={handleSubmit}>
      <h4 className="mb-4 text-center">Enter Your Preferences</h4>
      {/* Morning Person Toggle */}
      <Form.Group className="mb-3">
        <Form.Check
          type="switch"
          id="morning-person"
          label="I'm a morning person"
          checked={prefs.morning_person}
          onChange={(e) => handleChange("morning_person", e.target.checked)}
        />
      </Form.Group>

      {/* Busyness Dropdown */}
      <Form.Group className="mb-3">
        <Form.Label>How busy are you? <span className="text-danger">*</span></Form.Label>
        <Form.Select
          value={prefs.busyness}
          onChange={(e) => handleChange("busyness", e.target.value)}
          required
        >
          <option value="">Select option</option>
          <option value="very busy">Very busy</option>
          <option value="somewhat busy">Somewhat busy</option>
          <option value="not busy">Not busy</option>
          <option value="open schedule">Open schedule</option>
        </Form.Select>
      </Form.Group>

      {/* Least Busy Days (Checkboxes) */}
      <Form.Group className="mb-3">
        <Form.Label>Least busy days</Form.Label>
        <div>
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
            <Form.Check
              key={day}
              type="checkbox"
              id={`day-checkbox-${day}`}
              label={day}
              checked={prefs.least_busy_days?.includes(day) || false}
              onChange={(e) => {
                const isChecked = e.target.checked;
                let updatedDays: string[] = Array.isArray(prefs.least_busy_days) 
                  ? [...prefs.least_busy_days] 
                  : [];

                if (isChecked) {
                  if (!updatedDays.includes(day)) {
                    updatedDays.push(day);
                  }
                } else {
                  updatedDays = updatedDays.filter((d) => d !== day);
                }
                
                handleChange("least_busy_days", updatedDays.length > 0 ? updatedDays : null);
              }}
              inline
            />
          ))}
        </div>
      </Form.Group>

      {/* School/Work Info */}
      <Form.Group className="mb-3">
        <Form.Label>School or Work</Form.Label>
        <Row>
          <Col>
            <Form.Control
              type="text"
              placeholder="Type (e.g. School, Job)"
              value={prefs.school_work?.type || ""}
              onChange={(e) =>
                handleChange("school_work", {
                  ...prefs.school_work,
                  type: e.target.value,
                })
              }
            />
          </Col>
          <Col>
            <Form.Control
              type="number"
              placeholder="Hours per day"
              value={prefs.school_work?.hours || ""}
              onChange={(e) =>
                handleChange("school_work", {
                  ...prefs.school_work,
                  hours: e.target.value,
                })
              }
            />
          </Col>
        </Row>
      </Form.Group>

      {/* Earliest Awake / Latest Asleep */}
      <Row>
        <Col>
          <Form.Group className="mb-3">
            <Form.Label>Earliest you wake up <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="time"
              value={prefs.earliest_awake || ""}
              onChange={(e) =>
                handleChange("earliest_awake", e.target.value || null)
              }
              required
            />
          </Form.Group>
        </Col>

        <Col>
          <Form.Group className="mb-3">
            <Form.Label>Latest you go to sleep <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="time"
              value={prefs.latest_asleep || ""}
              onChange={(e) =>
                handleChange("latest_asleep", e.target.value || null)
              }
              required
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Other Info */}
      <Form.Group className="mb-3">
        <Form.Label>Other Info</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          placeholder="Anything else you'd like us to know?"
          value={prefs.other_info || ""}
          onChange={(e) => handleChange("other_info", e.target.value || null)}
        />
      </Form.Group>
      
      {/* Submit Button */}
      <div className="d-flex justify-content-end">
        <Button type="submit" variant="primary">
          Save Preferences
        </Button>
      </div>

    </Form>
  );
}


async function connectGoogle() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    alert("Please log in first.");
    return;
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_PROJECT_URL!}api/google/callback`

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", user.id);

  window.location.href = authUrl.toString();
}