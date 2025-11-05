export const metadata = {
  title: "Login",
};

import GroupClient from "./GroupClient";

export default function LoginPage({ params }: { params: Promise<{ groupId: string }> }) {
    return <GroupClient params={params}/>;
}

