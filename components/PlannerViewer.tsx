import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { deletePlanner } from "@/lib/planners";

type Planner = {
  id: string;
  name: string;
};

export default function PlannerViewer({ userId }: { userId: string | undefined }) {
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [loading, setLoading] = useState(true);

  

  async function handleDeletePlanner(plannerId: string) {
    try {
      if (userId === undefined) return
      // Await the delete
      await deletePlanner(userId, plannerId);

      // Optimistically remove the planner from state
      setPlanners((prev) => prev.filter((p) => p.id !== plannerId));

      // Optionally, refetch from Supabase to make sure state is consistent
      // await fetchPlanners();
    } catch (err) {
      console.error("Failed to delete planner:", err);
      alert("Could not delete planner. Try again.");
    }
  }

  useEffect(() => {
    async function fetchPlanners() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("planners")
          .select("id, name")
          .eq("owned_by", userId);

        if (error) throw error;
        setPlanners(data || []);
      } catch (err) {
        console.error("Failed to fetch planners:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlanners();
  }, [userId]);

  if (loading) return <p>Loading planners...</p>;
  if (!loading && planners.length === 0)
    
    return <p>No planners found. Create one to get started!</p>;

  return (
    <div className="planner-list space-y-4">
      <h3 className="text-primary">Current Planners</h3>
      {planners.map((planner) => (
        <div
          key={planner.id}
          className="planner-card p-4 my-1 border rounded shadow-sm bg-white"
        >
          <h4 className="text-xl font-bold">{planner.name}</h4>
          <button
            className="mt-4 btn btn-outline-danger"
            onClick={() => handleDeletePlanner(planner.id)}
          >
            Delete Planner
          </button>
        </div>
      ))}
    </div>
  );
}
