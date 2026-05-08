
"use client";

import { Trophy, Users, Calendar, ArrowUpRight, Plus, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockTournaments } from '@/app/lib/mock-store';
import Link from 'next/link';

export default function AdminDashboard() {
  const activeTournaments = mockTournaments.filter(t => t.status === 'Active');
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Quick snapshot of your tournament management system.</p>
        </div>
        <Button className="flex items-center gap-2 shadow-lg">
          <Plus className="h-4 w-4" /> Create New Tournament
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Total Tournaments <Trophy className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{mockTournaments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Active Now <Activity className="h-4 w-4 text-green-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{activeTournaments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Registered Teams <Users className="h-4 w-4 text-accent" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">12</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Upcoming Games <Calendar className="h-4 w-4 text-orange-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">8</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Active Tournaments</CardTitle>
            <CardDescription>Manage scores and team registries for active events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeTournaments.map(tournament => (
              <div key={tournament.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center text-primary">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">{tournament.name}</h4>
                    <p className="text-xs text-muted-foreground">{tournament.format} • {tournament.teams.length} Teams Registered</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/tournaments/${tournament.id}`}>
                    Manage <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium">Result Updated</p>
                  <p className="text-xs text-muted-foreground">Eagles FC vs Lions United: 2-1</p>
                  <p className="text-[10px] text-muted-foreground mt-1">2 hours ago</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium">New Team Registered</p>
                  <p className="text-xs text-muted-foreground">Defense Towers joined Summer Cup</p>
                  <p className="text-[10px] text-muted-foreground mt-1">5 hours ago</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium">Tournament Created</p>
                  <p className="text-xs text-muted-foreground">Regional Winter qualifiers</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Yesterday</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
