import { supabase } from "../lib/supabaseClient";

export async function getServerSideProps({}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  return { props: { user: session.user } };
}
