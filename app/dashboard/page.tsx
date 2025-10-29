"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserGroups } from "@/lib/group";
import Link from "next/link";
import { useUserAccount } from "@/lib/hooks/useUserAccount";

import NotificationViewer from "@/components/NotificationViewer";
import EventsCalendar from "@/components/EventsCalendar";
import ProPill from "@/components/ProPill";
import { supabase } from "@/lib/supabaseClient";

interface UserGroup {
  id: string;
  name: string;
  created_by: string;
  isCreator: boolean;
  join_code: string;
  user_count: number;
}

export default function Dashboard() {
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
  const router = useRouter();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'calendar' | 'chat' | 'groups'>('alerts');

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

  if (loading || fetching) return <h1>Loading...</h1>;
  if (!user) return null;

  const GroupsContent = () => (
    <div>
      {groups.length === 0 ? (
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
                    disabled={!hasProAccess}
                  >
                    AI Planner{ !hasProAccess && (
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
                    <NotificationViewer groupIds={groupIds}/>
                  </section>
                )}

                {/* Personal Calendar Section */}
                {activeTab === 'calendar' && (
                  <section className="tab-pane fade show active">
                    <h4>Personal Calendar</h4>
                    <EventsCalendar groupIds={groupIds} isCreator={false} isPersonal={true} />
                  </section>
                )}

                {/* AI Chat Section */}
                {activeTab === 'chat' && (
                  <section className="tab-pane fade show active">
                    <h4>AI Planner - { calendarUsed.includes("google") ? (<span className="fw-light fs-5 text-secondary">Using Google Calendar</span>) : (<span className="fw-light fs-5 text-secondary">No Calendar Connected</span>)}</h4>
                    { !calendarUsed.includes("google") && (<button className="btn btn-primary" onClick={connectGoogle}>Connect Google Calendar</button>)}
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

async function connectGoogle() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    alert("Please log in first.");
    return;
  }

  const redirectUri = `http://localhost:3000/api/google/callback`;

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