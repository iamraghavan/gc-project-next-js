
"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import { GitDriveLogo } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, File, History, Settings, LogOut, Code } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const user = auth.currentUser
  const [time, setTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    // Set initial time on client to avoid hydration mismatch
    setTime(new Date()); 
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  const isActive = (path: string) => pathname === path

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <GitDriveLogo className="h-8 w-8 text-sidebar-primary" />
            <span className="text-lg font-semibold">GitDrive</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/drive/files")}>
                <Link href="/drive/files">
                  <File />
                  Files
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/drive/dashboard")}>
                <Link href="/drive/dashboard">
                  <LayoutDashboard />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/drive/logs")}>
                <Link href="/drive/logs">
                  <History />
                  Access Logs
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/drive/api")}>
                    <Link href="/drive/api">
                        <Code />
                        API Access
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <SidebarMenu>
             <SidebarMenuItem>
              <SidebarMenuButton>
                <Settings />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut />
                Logout
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="flex items-center gap-2 p-2 border-t mt-2">
             <Avatar>
                <AvatarImage src={user?.photoURL || undefined} alt="User avatar" />
                <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="font-semibold text-sm">{user?.displayName || 'User'}</span>
                <span className="text-xs text-sidebar-foreground/70">{user?.email}</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
                {time ? (
                    <div className="text-sm text-right">
                        <div className="font-mono">{format(time, 'HH:mm:ss')}</div>
                        <div className="text-xs text-muted-foreground">{format(time, 'PPP EEE')}</div>
                    </div>
                ) : (
                    <div className="text-sm text-right">
                        <div className="font-mono">--:--:--</div>
                        <div className="text-xs text-muted-foreground">Loading...</div>
                    </div>
                )}
                <Avatar>
                    <AvatarImage src={user?.photoURL || undefined} alt="User avatar" data-ai-hint="user avatar" />
                    <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
            </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
