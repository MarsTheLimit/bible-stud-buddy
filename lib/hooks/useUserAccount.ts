import { useEffect, useState } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { supabase } from "@/lib/supabaseClient";
import { UserScheduleData } from "@/components/PreferencesPopup";

export type UserAccount = {
  email: string | null;
  display_name: string | null;
  account_type: 'free' | 'pro';
  trial_ends_at: string | null;
  trial_used: boolean;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
  schedule_prefs: unknown | null;
  planners: string[];
  tokens_left: number;
};

const DATA_SELECTION = 'email, display_name, account_type, trial_ends_at, trial_used, stripe_subscription_id, stripe_customer_id, google_access_token, google_refresh_token, schedule_prefs, planners, tokens_left'

// Also update the Partial type to include the new fields
type UserAccountUpdates = Partial<UserAccount & { id?: string }>;

export function useUserAccount() {
  const { supabase, user, loading: authLoading } = useSupabase();
  const [accountData, setAccountData] = useState<UserAccount | undefined>();
  const [schedulePrefs, setSchedulePrefs] = useState<UserScheduleData>();
  const [planners, setPlanners] = useState<string[] | null>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function setData(data: UserAccount) {
    setAccountData(data);
    setSchedulePrefs(data.schedule_prefs as UserScheduleData);
    setPlanners(data.planners);
  }

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setAccountData(undefined);
      setLoading(false);
      return;
    }

    async function fetchAccountData() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(DATA_SELECTION) 
          .eq('id', user?.id)
          .single();

        if (error) throw error;
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch account');
      } finally {
        setLoading(false);
      }
    }

    fetchAccountData();
  }, [supabase, user, authLoading]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      if (!user) {
        setAccountData(undefined);
        return null;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select(DATA_SELECTION) 
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setData(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function updateAccount(updates: UserAccountUpdates) {
    if (!user) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select(DATA_SELECTION)
        .single();

      if (error) throw error;
      setData(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function upsertAccount(initial: UserAccountUpdates) {
    if (!user) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);

    try {
      const payload = { id: user.id, ...initial };
      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select(DATA_SELECTION)
        .single();

      if (error) {
        throw error;
      }
      setData(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function getUserCalendar() {
    const calendarsUsed = [];
    if (accountData?.google_access_token != null) {
      calendarsUsed.push('google');
    }
    return calendarsUsed;
  }

  const hasActiveTrial = accountData?.trial_ends_at
    ? new Date(accountData.trial_ends_at) > new Date()
    : false;

  const accessLevel = hasActiveTrial
    ? 'pro'
    : accountData?.account_type || 'free';

  const calendarUsed = getUserCalendar();
  return {
    supabase,
    user,
    accountData,
    loading: authLoading || loading,
    error,
    hasActiveTrial,
    accessLevel,
    hasProAccess: accessLevel === 'pro',
    calendarUsed,
    schedulePrefs,
    planners,
    refresh,
    updateAccount,
    upsertAccount,
  };
}

export async function updateUserTokens(userId: string, newTokenCount: number) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ tokens_left: newTokenCount })
    .eq("id", userId)
    .select("tokens_left")
    .single();

  if (error) {
    console.error("Failed to update user tokens:", error);
    throw error;
  }

  return data.tokens_left;
}
