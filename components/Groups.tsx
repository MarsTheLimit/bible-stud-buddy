import Link from "next/link";
import { LoadingSpinner } from "./Loading";

export interface UserGroup {
  id: string;
  name: string;
  created_by: string;
  isCreator: boolean;
  join_code: string;
  user_count: number;
}

export function GroupsContent({isLoading, groups}: {isLoading: boolean, groups: UserGroup[]}) {
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
}