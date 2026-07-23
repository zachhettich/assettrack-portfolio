import { supabase } from "../../lib/supabase";

export async function syncProfileName(user) {
  if (!user?.id) return;

  const metadataName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "";

  if (!metadataName) return;

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", user.id)
    .single();

  if (!existingProfile) return;

  if (!existingProfile.full_name || existingProfile.full_name.trim() === "") {
    await supabase
      .from("profiles")
      .update({ full_name: metadataName })
      .eq("id", user.id);
  }
}

export async function getProfile(userId, { setMessage, setProfile }) {
  setMessage("");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", userId)
    .single();

  if (error || !data) {
    setProfile(null);
    setMessage(
      "Profile not found. Make sure the user exists in public.profiles and has a role.",
    );
    return;
  }

  setProfile(data);
}

export async function handleSignUp({
  e,
  fullName,
  email,
  password,
  supabaseClient = supabase,
  setAuthLoading,
  setMessage,
  setFullName,
  setEmail,
  setPassword,
  setAuthMode,
}) {
  e.preventDefault();
  setAuthLoading(true);
  setMessage("");

  if (!fullName.trim()) {
    setMessage("Name is required.");
    setAuthLoading(false);
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName.trim(),
      },
    },
  });

  if (error) {
    setMessage(error.message);
  } else {
    setMessage("Account created. Your name was saved for your profile.");
    setFullName("");
    setEmail("");
    setPassword("");
    setAuthMode("signin");
  }

  setAuthLoading(false);
}

export async function handleSignIn({
  e,
  email,
  password,
  supabaseClient = supabase,
  setAuthLoading,
  setMessage,
  setPassword,
}) {
  e.preventDefault();
  setAuthLoading(true);
  setMessage("");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setMessage(error.message);
  } else {
    setMessage("Signed in successfully.");
    setPassword("");
  }

  setAuthLoading(false);
}

export async function handleSignOut({ supabaseClient = supabase, setMessage }) {
  await supabaseClient.auth.signOut();
  setMessage("Signed out.");
}

export async function initializeAuthSession({
  supabaseClient = supabase,
  setSession,
  setLoading,
  syncProfileNameFn,
  getProfileFn,
  getToolsFn,
  getActivityFn,
  getCompanyUpdatesFn,
  getCompanyFormsFn,
}) {
  const { data } = await supabaseClient.auth.getSession();
  setSession(data.session);

  if (data.session?.user) {
    await syncProfileNameFn(data.session.user, {});
    await getProfileFn(data.session.user.id, {});
    await Promise.all([
      getToolsFn(),
      getActivityFn(),
      getCompanyUpdatesFn(),
      getCompanyFormsFn(),
    ]);
  }

  setLoading(false);

  return () => {
    // no-op unsubscribe hook here; App.jsx owns subscription
    // included for ergonomic parity if we extend later.
    return;
  };
}
