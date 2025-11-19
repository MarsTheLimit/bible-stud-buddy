"use client";

import { use, useEffect, useState } from "react";
import { useUserAccount, UserAccount } from "@/lib/hooks/useUserAccount";

export default function ProfileClient({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = use(params);
    const {
        supabase,
        user,
    } = useUserAccount();
    const [loading, setLoading] = useState(true);
    const [userProfileData, setUserProfileData] = useState<UserAccount | null>(null);
    const [isUserOwner, setUserOwner] = useState(false);
    const [displayName, setDisplayName] = useState("");

    useEffect(() => {
        async function fetchUser() {
            setLoading(true);
            try {
                const { data: userData, error: userError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", userId)
                    .single();

                if (userError || !userData) {
                    console.error("User not found or error:", userError);
                    setLoading(false);
                    return;
                }

                if (userData?.display_name) setDisplayName(userData?.display_name);
                else setDisplayName(userData?.email);

                setUserProfileData(userData);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();

        if (user?.id === userId) {
            setUserOwner(true);
        }

    }, [userId, supabase, user?.id]);

    if (loading) return <p>Loading...</p>

    return (
        <div className="container py-5">
            <h1>{isUserOwner ? (`Welcome, ${displayName}`) : (`${displayName}'s Profile`)}</h1>
        </div>
    )
}