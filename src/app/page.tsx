
"use client";

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GitDriveLogo } from "@/components/icons"
import { Github, Loader2 } from "lucide-react"
import { 
  signInWithEmailAndPassword, 
  GithubAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast"
import packageJson from "../../package.json";


export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
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
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/drive/files");
    } catch (error: any) {
       toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGitHubLogin = async () => {
    setIsLoading(true);
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
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="flex-grow flex items-center justify-center">
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
                        disabled={isLoading}
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
                        disabled={isLoading}
                    />
                    </div>
                    <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Login
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleGitHubLogin} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
        <footer className="py-4 text-center text-xs text-muted-foreground">
            A product by Bumble Bees | v{packageJson.version} | All rights reserved
        </footer>
    </div>
  )
}
