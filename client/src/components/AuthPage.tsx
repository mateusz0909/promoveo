import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useState } from "react";

export function AuthPage({ type }: { type: "login" | "signup" }) {
  const [loadingProvider, setLoadingProvider] = useState<"google" | "github" | "apple" | null>(null);

  const title = type === "login" ? "Welcome Back" : "Get Started";
  const description =
    type === "login"
      ? "Sign in to your account to continue"
      : "Create your account to get started";

  const handleGoogleSignIn = async () => {
    setLoadingProvider("google");
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: "google",
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      // Don't navigate here - the OAuth redirect will handle it
    } catch (error) {
      console.error("Google sign in error:", error);
      setLoadingProvider(null);
    }
  };

  const handleGithubSignIn = async () => {
    setLoadingProvider("github");
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: "github",
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      // Don't navigate here - the OAuth redirect will handle it
    } catch (error) {
      console.error("GitHub sign in error:", error);
      setLoadingProvider(null);
    }
  };

  const handleAppleSignIn = async () => {
    setLoadingProvider("apple");
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: "apple",
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      // Don't navigate here - the OAuth redirect will handle it
    } catch (error) {
      console.error("Apple sign in error:", error);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src="/promeveo.svg" alt="Promeveo Logo" className="h-12" />
          </div>
          <CardTitle className="text-3xl font-bold">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Sign In */}
          <Button 
            variant="outline" 
            size="lg"
            onClick={handleGoogleSignIn} 
            disabled={loadingProvider !== null}
            className="w-full h-12 text-base hover:cursor-pointer"
          >
            {loadingProvider === 'google' ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 62.3l-66.5 64.6C305.5 102.2 279.5 96 248 96c-88.8 0-160.1 71.1-160.1 160s71.3 160 160.1 160c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          {/* GitHub Sign In */}
          <Button 
            variant="outline" 
            size="lg"
            onClick={handleGithubSignIn} 
            disabled={loadingProvider !== null}
            className="w-full h-12 text-base hover:cursor-pointer"
          >
            {loadingProvider === 'github' ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"></path>
                </svg>
                Continue with GitHub
              </>
            )}
          </Button>

          {/* Apple Sign In */}
          {/* <Button 
            variant="outline" 
            size="lg"
            onClick={handleAppleSignIn} 
            disabled={loadingProvider !== null}
            className="w-full h-12 text-base hover:cursor-pointer"
          >
            {loadingProvider === 'apple' ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="mr-2 h-10 w-10" fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
                Continue with Apple
              </>
            )}
          </Button> */}

          <div className="text-center text-sm text-muted-foreground mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
