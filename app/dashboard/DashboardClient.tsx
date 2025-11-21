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
import { Button } from "react-bootstrap";
import { PreferencesPopup } from "@/components/PreferencesPopup";
import CreateStudyPlan from "@/components/CreateStudyPlan";
import PlannerViewer from "@/components/PlannerViewer";
import { LoadingSpinner } from "@/components/Loading";
import { UserGroup } from "@/components/Groups";
import { PreferencesInput } from "@/components/PreferencesInput";
import ProfileContent from "@/components/Profile";

export default function DashboardClient() {
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
    displayName,
    refresh
  } = useUserAccount();
  const size = useWindowSize();
  const router = useRouter();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'calendar' | 'chat' | 'groups' | 'profiles'>('profiles');
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

  async function onChangeName(newName: string) {
    try {
      await updateAccount({ display_name: newName });
      await refresh();
    } catch (err) {
      console.error("Error changing user's name:", err)
    }
  }
  
  if (!loading && !user) return null;

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

  if (!size) return null

  return (
    <div className={`container ${(size?.width > 900) ? ("px-5") : ("px-0")} my-5`}>
      <header className={"text-center mb-5"}>
        <h1 className="display-5 fw-bolder mb-0">
          <span className="text-gradient d-inline">Dashboard</span>
        </h1>
      </header>

      <div className="row">
        {/* Main Content - Takes up 8 columns on large screens, full width on small */}
        <div className="col-lg-8 mb-4">
          <div className={`${(size?.width > 900) && ("card overflow-hidden shadow rounded-4 border-0")}`}>
            <div className={`${(size?.width > 900) && ("card-body")}`}>
              {/* Tab Navigation */}
              <ul className="nav nav-tabs mb-4" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'profiles' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profiles')}
                    type="button"
                    role="tab"
                  >
                    Profile
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
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link d-lg-none ${activeTab === 'alerts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('alerts')}
                    type="button"
                    role="tab"
                  >
                    Notifications
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
                      <div className="m-1 my-0"><ProPill accessLevel="pro" hasActiveTrial={false} /></div>
                    )}
                  </button>
                </li>
              </ul>

              <div className="tab-content">
                {/* Alerts Section */}
                <div 
                  className={activeTab === 'alerts' ? 'd-lg-none' : 'd-none'}
                  role="tabpanel"
                >
                  {isLoading ? (
                    <LoadingSpinner text="Loading notifications..." />
                  ) : (
                    <NotificationViewer groupIds={groupIds} />
                  )}
                </div>

                {/* Personal Calendar Section */}
                <div 
                  className={activeTab === 'calendar' ? '' : 'd-none'}
                  role="tabpanel"
                >
                  {isLoading ? (
                    <LoadingSpinner text="Loading calendar..." />
                  ) : (
                    <EventsCalendar
                      key={calendarKey}
                      isCreator={true}
                      isPersonal={true}
                      groupIds={groupIds}
                      onEventAdded={handleCalendarRefresh}
                    />
                  )}
                </div>

                {/* Profile Section */}
                <div 
                  className={activeTab === 'profiles' ? '' : 'd-none'}
                  role="tabpanel"
                >
                  <ProfileContent 
                    displayName={displayName}
                    onChangeName={onChangeName}
                  />
                </div>

                {/* AI Chat Section */}
                <div className={activeTab === 'chat' ? '' : 'd-none'} role="tabpanel">
                  {isLoading ? (
                    <LoadingSpinner text="Loading AI planner..." />
                  ) : (
                    <>
                      {calendarUsed.includes("google") ? (
                        <p>(Using Google Calendar)</p>
                      ) : (
                        <div className="alert alert-warning">
                          <strong>No Calendar Connected</strong>
                        </div>
                      )}
                      
                      {schedulePrefs && (
                        <PreferencesPopup onEdit={handleUpdateUserPreferences}/>
                      )}

                      {!calendarUsed.includes("google") ? (
                        <>
                          <Button onClick={connectGoogle} className="mb-3">
                            Connect Google Calendar
                          </Button>
                          <p className="text-muted small">
                            By clicking this button, you allow this app to view your Google Calendar 
                            events to display your schedule. If you create a Bible study plan with AI, 
                            your data is used only to personalize your plan and is never shared with 
                            third parties. Privacy Policy.
                          </p>
                        </>
                      ) : (
                        <>
                          {((accountData?.tokens_left ?? 0) >= 2000) ? (
                            <p>You can make about {Math.ceil((accountData?.tokens_left ?? 0) / 5000)} new planners this month</p>
                          ) : (
                            <p>You can&apos;t make any new planners this month</p>
                          )}
                          
                          {(schedulePrefs === null) ? (
                            <PreferencesInput
                              onSubmit={async (prefs) => {
                                try {
                                  await updateAccount({ schedule_prefs: prefs });
                                  console.log("Preferences saved to Supabase:", prefs);
                                } catch (err) {
                                  console.error("Failed to update preferences:", err);
                                }
                              }}
                            />
                            ) : (
                              <div>
                                {((planners?.length ?? 0) === 0) ? (
                                  <CreateStudyPlan
                                    schedulePrefs={schedulePrefs}
                                    userEvents={events}
                                    onSubmit={async () => {
                                      const oneMonthFromNow = new Date();
                                      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
                                      setEvents(await loadEvents(supabase, true, user, groupIds, oneMonthFromNow));
                                      return events;
                                    }}
                                    tokensLeft={(accountData?.tokens_left ?? 0)}
                                    onPlannerCreated={refresh}
                                  />
                                ) : (
                                  <PlannerViewer
                                    userId={user?.id}
                                    onPlannerDeleted={refresh}
                                    />
                                )}
                              </div>
                            )}
                          </>
                        )}
                    </>
                  )}
                </div>

                {/* Groups Section - Only shows as tab on small screens */}
                <div 
                  className={activeTab === 'groups' ? 'd-lg-none' : 'd-none'}
                  role="tabpanel"
                >
                  <GroupsContent />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Groups and Notifications Sidebar - Only visible on large screens */}
        <aside className="col-lg-4 mb-4 d-none d-lg-block">
          <div className="card overflow-hidden shadow rounded-4 border-0 sticky-top mb-4" style={{ top: '20px' }}>
            <div className="card-header">
              <h2 className="h3 mb-0">Your Groups</h2>
            </div>
            <div className="card-body p-0">
              <GroupsContent />
            </div>
          </div><div className="card overflow-hidden shadow rounded-4 border-0 sticky-top" style={{ top: '20px' }}>
            <div className="card-header">
              <h2 className="h3 mb-0">Notifications</h2>
            </div>
              {isLoading ? (
                <LoadingSpinner text="Loading notifications..." />
              ) : (
                <NotificationViewer groupIds={groupIds} />
              )}
          </div>
        </aside>
      </div>
    </div>
  );
}

type WindowSize = {
  width: number;
  height: number;
} | undefined;

function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  const [windowSize, setWindowSize] = useState<WindowSize>(undefined);

  useEffect(() => {
    // only execute all the code below in client side
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener("resize", handleResize);
     
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
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