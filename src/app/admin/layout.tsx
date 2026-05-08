
import Link from 'next/link';
import { 
  Trophy, 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Calendar,
  Layers
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger,
  SidebarInset
} from '@/components/ui/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r shadow-sm">
          <SidebarHeader className="p-6 border-b">
            <Link href="/" className="flex items-center gap-2 font-headline text-xl font-bold text-primary">
              <Trophy className="h-6 w-6" />
              <span>ScoreFlow</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link href="/admin">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Tournaments">
                  <Link href="/admin/tournaments">
                    <Layers className="h-4 w-4" />
                    <span>Tournaments</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Calendar">
                  <Link href="/admin/calendar">
                    <Calendar className="h-4 w-4" />
                    <span>Global Calendar</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link href="/admin/settings">
                    <Settings className="h-4 w-4" />
                    <span>System Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t">
            <SidebarMenuButton className="text-destructive hover:bg-destructive/10" asChild>
              <Link href="/">
                <LogOut className="h-4 w-4" />
                <span>Exit Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex flex-col h-full">
          <header className="h-16 border-b flex items-center px-6 justify-between bg-white shrink-0">
             <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h2 className="font-semibold text-primary">Admin Control Center</h2>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                  JS
                </div>
                <span className="text-sm font-medium">Juan Sebastian</span>
             </div>
          </header>
          <main className="flex-1 overflow-auto p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
