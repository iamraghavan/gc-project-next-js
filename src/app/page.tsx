
"use client";

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GitDriveLogo } from "@/components/icons"
import { Github } from "lucide-react"
import { 
  signInWithEmailAndPassword, 
  GithubAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Login Failed",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/drive/files");
    } catch (error: any) {
       toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const handleGitHubLogin = async () => {
    const provider = new GithubAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/drive/files");
    } catch (error: any) {
       toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm">
        <CardHeader className="text-center">
          <GitDriveLogo className="h-12 w-12 mx-auto text-primary" />
          <CardTitle className="text-2xl mt-4">Login to GitDrive</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button className="w-full" onClick={handleLogin}>
              Login
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGitHubLogin}>
              <Github className="mr-2 h-4 w-4" />
              Login with GitHub
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="#" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
