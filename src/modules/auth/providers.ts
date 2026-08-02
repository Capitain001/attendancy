"use client"

import { supabase } from "@/utils/supabase/client";


export const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    
    });
    if (error) console.error("Google login error:", error.message);
  };


export  const signInWithGoogle = async (next?: string) => {
  const redirectUrl = `${window.location.origin}/auth/oauth?next=${encodeURIComponent(next || "")}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (error) alert(error.message);
  };
  


  export  const signInWithOauth = async ({next }: {next?:string}) => {
    const redirectUrl = `${window.location.origin}/auth/oauth?next=${encodeURIComponent(next || "")}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) alert(error.message);
    };
    