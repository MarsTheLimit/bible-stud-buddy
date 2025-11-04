"use client";

import { createGroup, joinGroup } from "@/lib/group";
import { useSupabase } from "@/components/SupabaseProvider";
import { useUserAccount } from "@/lib/hooks/useUserAccount"; // make sure this path is correct
import { useEffect, useState } from "react";

export default function GroupsPage() {
  const { supabase, user, loading: authLoading } = useSupabase();
  const { accessLevel, hasActiveTrial, loading: accountLoading } = useUserAccount();

  const [activeTab, setActiveTab] = useState("create");
  const [joinCode, setJoinCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [groupCount, setGroupCount] = useState<number>(0);

  useEffect(() => {
    async function getUserGroupCount() {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("groups")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id);
      if (error) {
        console.error("Failed to count user groups:", error);
        return 0;
      }
      return count || 0;
    }
    if (user) {
      getUserGroupCount().then(setGroupCount);
    }
  }, [supabase, user]);

  const isLimitedPlan = accessLevel === "free" || hasActiveTrial;
  const reachedGroupLimit = isLimitedPlan && groupCount >= 1;

  // Create a group
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (reachedGroupLimit) {
      setMessageError(true);
      setMessage("You've reached the free plan limit. Upgrade to create more groups.");
      return;
    }

    try {
      const group = await createGroup(supabase, groupName);
      setMessageError(false);
      setMessage(`Successfully created '${group.name}'! Join code: ${group.join_code}`);
      setGroupCount(groupCount + 1);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessageError(true);
        setMessage(err.message);
      } else {
        setMessageError(true);
        setMessage("Unknown error");
      }
    }
  }

  // Join a group
  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      const group = await joinGroup(supabase, joinCode.toUpperCase());
      setMessageError(false);
      setMessage(`Successfully joined ${group.name}!`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessageError(true);
        setMessage(err.message);
      } else {
        setMessageError(true);
        setMessage("Unknown error");
      }
    }
  }

  const isLoading = authLoading || accountLoading;

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <h1 className="text-center text-gradient">Groups</h1>

      <div className="container mt-5">
        {/* Tabs Navigation */}
        <ul className="nav nav-tabs mb-3 justify-content-center">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "create" ? "active" : ""}`}
              onClick={() => !reachedGroupLimit && setActiveTab("create")}
              disabled={reachedGroupLimit}
              style={{ cursor: reachedGroupLimit ? "not-allowed" : "pointer", opacity: reachedGroupLimit ? 0.6 : 1 }}
            >
              Create Group
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "join" ? "active" : ""}`}
              onClick={() => setActiveTab("join")}
            >
              Join Group
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        <div className="tab-content border rounded p-4 bg-light shadow-sm">
          {/* Join group form */}
          {activeTab === "join" && (
            <div className="tab-pane fade show active">
              <h2 className="mb-4">Join a Group</h2>
              <form className="form-group" onSubmit={handleJoin}>
                <input
                  className="form-control mb-3"
                  type="text"
                  placeholder="Join Code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  required
                />
                <button className="btn btn-primary w-100 mb-2" disabled={isLoading}>
                  Join Group
                </button>
              </form>
            </div>
          )}

          {/* Create group form */}
          {activeTab === "create" && (
            <div className="tab-pane fade show active">
              <h2 className="mb-4">Create a Group</h2>
              <form className="form-group" onSubmit={handleCreate}>
                <input
                  className="form-control mb-3"
                  type="text"
                  placeholder="Group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  disabled={reachedGroupLimit}
                />
                <button
                  className="btn btn-primary w-100 mb-2"
                  disabled={reachedGroupLimit || isLoading}
                >
                  {reachedGroupLimit ? "Limit Reached" : "Create Group"}
                </button>
              </form>
            </div>
          )}

          {message && (
            <p
              className={`alert mt-3 text-center ${
                messageError ? "alert-danger" : "alert-success"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
