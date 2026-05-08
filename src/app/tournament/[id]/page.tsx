
"use client";

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Calendar, Users, ArrowLeft, Info, LayoutGrid, List } from 'lucide-react';
import { mockTournaments, calculateStandings } from '@/app/lib/mock-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TournamentDetail() {
  const params = useParams();
  const id = params.id as string;
  const tournament = mockTournaments.find(t => t.id === id);

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
        <Button asChild><Link href="/">Back to Home</Link></Button>
      </div>
    );
  }

  const standings = calculateStandings(tournament);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-flex items-center text-primary-foreground/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tournaments
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none">
                  {tournament.format}
                </Badge>
                <Badge className={tournament.status === 'Active' ? 'bg-green-500 hover:bg-green-600 border-none' : 'bg-blue-500 hover:bg-blue-600 border-none'}>
                  {tournament.status}
                </Badge>
              </div>
              <h1 className="text-4xl font-headline font-bold mb-2">{tournament.name}</h1>
              <p className="text-primary-foreground/80 max-w-2xl">{tournament.description}</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/10 rounded-lg p-3 px-6 text-center">
                <div className="text-sm opacity-60">Teams</div>
                <div className="text-2xl font-bold">{tournament.teams.length}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 px-6 text-center">
                <div className="text-sm opacity-60">Matches</div>
                <div className="text-2xl font-bold">{tournament.matches.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        <Tabs defaultValue="standings" className="space-y-8">
          <div className="bg-white p-1 rounded-xl shadow-md inline-flex">
            <TabsList className="bg-transparent">
              <TabsTrigger value="standings" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" /> Standings
              </TabsTrigger>
              <TabsTrigger value="matches" className="flex items-center gap-2">
                <List className="h-4 w-4" /> Matches
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Teams
              </TabsTrigger>
              {tournament.status === 'Completed' && (
                <TabsTrigger value="highlights" className="flex items-center gap-2">
                  <Info className="h-4 w-4" /> Highlights
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="standings" className="space-y-6">
            {tournament.format === 'League' ? (
              <Card>
                <CardHeader>
                  <CardTitle>League Table</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Pos</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-center">P</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">D</TableHead>
                        <TableHead className="text-center">L</TableHead>
                        <TableHead className="text-center">GD</TableHead>
                        <TableHead className="text-center font-bold">Pts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings.map((entry, idx) => (
                        <TableRow key={entry.teamId}>
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell className="font-semibold text-primary">{entry.teamName}</TableCell>
                          <TableCell className="text-center">{entry.played}</TableCell>
                          <TableCell className="text-center text-green-600">{entry.won}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{entry.drawn}</TableCell>
                          <TableCell className="text-center text-red-600">{entry.lost}</TableCell>
                          <TableCell className="text-center">{entry.goalsFor - entry.goalsAgainst}</TableCell>
                          <TableCell className="text-center font-bold text-accent">{entry.points}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-muted-foreground/30">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">Knockout bracket visualization coming soon.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <div className="grid gap-4">
              {tournament.matches.sort((a, b) => b.date.getTime() - a.date.getTime()).map(match => {
                const homeTeam = tournament.teams.find(t => t.id === match.homeTeamId);
                const awayTeam = tournament.teams.find(t => t.id === match.awayTeamId);
                return (
                  <Card key={match.id} className="hover:border-accent/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 text-right font-semibold text-primary pr-4">{homeTeam?.name}</div>
                      <div className="flex flex-col items-center bg-secondary/30 rounded-lg px-6 py-2 min-w-[120px]">
                        <span className="text-xs text-muted-foreground mb-1">
                          {match.status === 'Completed' ? 'Result' : match.date.toLocaleDateString()}
                        </span>
                        <div className="text-2xl font-bold tracking-widest text-primary">
                          {match.status === 'Completed' ? `${match.homeScore} - ${match.awayScore}` : 'VS'}
                        </div>
                      </div>
                      <div className="flex-1 text-left font-semibold text-primary pl-4">{awayTeam?.name}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="teams" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tournament.teams.map(team => (
              <Card key={team.id} className="text-center p-6">
                <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Users className="h-10 w-10 text-primary opacity-20" />
                  )}
                </div>
                <h3 className="font-bold text-lg text-primary">{team.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{team.players.length} Players Registered</p>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="highlights">
             <Card className="bg-accent/5 border-accent/20">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Trophy className="h-5 w-5 text-accent" />
                   Tournament Summary
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="prose prose-blue max-w-none">
                   <p className="text-lg leading-relaxed text-primary">
                     {tournament.aiSummary || "AI summary for this tournament is still being generated. Check back shortly!"}
                   </p>
                 </div>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
