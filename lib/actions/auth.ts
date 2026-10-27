"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export async function deleteAccount() {
  const supabase = await createClient();
  // delete_user() is a security-definer RPC that removes the caller's auth.users row;
  // every user-owned table cascades off it, so all data goes with it.
  const { error } = await supabase.rpc("delete_user");
  if (error) throw new Error(error.message);
  await supabase.auth.signOut();
  redirect("/sign-in");
}
