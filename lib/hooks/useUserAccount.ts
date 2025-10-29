import { useEffect, useState } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';

type UserAccount = {
  account_type: 'free' | 'pro';
  trial_ends_at: string | null;
  trial_used: boolean;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
};

const DATA_SELECTION = 'account_type, trial_ends_at, trial_used, stripe_subscription_id, stripe_customer_id, google_access_token, google_refresh_token'

// Also update the Partial type to include the new fields
type UserAccountUpdates = Partial<UserAccount & { id?: string }>;

export function useUserAccount() {
  const { supabase, user, loading: authLoading } = useSupabase();
  const [accountData, setAccountData] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setAccountData(null);
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
        setAccountData(data);
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
        setAccountData(null);
        return null;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select(DATA_SELECTION) 
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setAccountData(data);
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

      setAccountData(data);
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

      if (error) throw error;

      setAccountData(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function getUserCalendar() {
    var calendarsUsed = [];
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
    refresh,
    updateAccount,
    upsertAccount,
  };
}