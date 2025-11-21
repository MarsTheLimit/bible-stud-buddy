export const metadata = {
  title: "Group",
};

import GroupClient from "./GroupClient";

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
    return <GroupClient params={params}/>;
}

