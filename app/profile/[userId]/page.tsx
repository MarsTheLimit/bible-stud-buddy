export const metadata = {
  title: "Profile",
};

import ProfileClient from "./ProfileClient";

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    return <ProfileClient params={params}/>;
}