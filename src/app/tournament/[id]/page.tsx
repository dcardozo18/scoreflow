
"use client";

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Trophy, Users, ArrowLeft, Info, LayoutGrid, List, Award, AlertCircle, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { calculateStandings } from '@/app/lib/mock-store';
import { db } from '@/lib/services/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Match, Tournament } from '@/app/lib/types';

export default function TournamentDetail() {
  const params = useParams();
  const id = params.id as string;
  const [isMounted, setIsMounted] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    db.getTournamentById(id).then(data => {
      setTournament(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!tournament) return <div className="p-10 text-center">Torneo no encontrado. <Button asChild><Link href="/">Volver</Link></Button></div>;

  const standings = calculateStandings(tournament);
  const groupedMatches = tournament.matches.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const roundNumbers = Object.keys(groupedMatches).map(Number).sort((a, b) => a - b);
  const allPlayers = tournament.teams.flatMap(team => team.players.map(player => ({ ...player, teamName: team.name })));
  const topScorers = [...allPlayers].sort((a, b) => b.goals - a.goals).slice(0, 10);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-flex items-center opacity-80 hover:opacity-100 mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Torneos
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-white/20 text-white">{tournament.format}</Badge>
                <Badge className={tournament.status === 'Active' ? 'bg-green-500' : 'bg-blue-500'}>{tournament.status}</Badge>
              </div>
              <h1 className="text-4xl font-headline font-bold mb-2">{tournament.name}</h1>
              <p className="text-primary-foreground/80 max-w-2xl">{tournament.description}</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/10 rounded-lg p-3 px-6 text-center">
                <div className="text-sm opacity-60">Equipos</div>
                <div className="text-2xl font-bold">{tournament.teams.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        <Tabs defaultValue="standings" className="space-y-8">
          <div className="bg-white p-1 rounded-xl shadow-md inline-flex flex-wrap gap-1">
            <TabsList className="bg-transparent h-auto">
              <TabsTrigger value="standings" className="gap-2"><LayoutGrid className="h-4 w-4" /> Posiciones</TabsTrigger>
              <TabsTrigger value="matches" className="gap-2"><List className="h-4 w-4" /> Partidos</TabsTrigger>
              <TabsTrigger value="stats" className="gap-2"><Award className="h-4 w-4" /> Estadísticas</TabsTrigger>
              <TabsTrigger value="teams" className="gap-2"><Users className="h-4 w-4" /> Equipos</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="standings">
            <Card>
              <CardHeader><CardTitle>Tabla General (Supabase)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pos</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead className="text-center">PJ</TableHead>
                      <TableHead className="text-center">G</TableHead>
                      <TableHead className="text-center font-bold">Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((entry, idx) => (
                      <TableRow key={entry.teamId}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-semibold">{entry.teamName}</TableCell>
                        <TableCell className="text-center">{entry.played}</TableCell>
                        <TableCell className="text-center text-green-600">{entry.won}</TableCell>
                        <TableCell className="text-center font-bold text-accent">{entry.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="space-y-12">
            {roundNumbers.map(roundNum => (
              <div key={roundNum} className="space-y-4">
                <h3 className="text-xl font-bold text-primary px-4 py-1 bg-primary/10 rounded-lg w-fit">Fecha {roundNum}</h3>
                <div className="grid gap-4">
                  {groupedMatches[roundNum].map(match => (
                    <Card key={match.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1 text-right font-semibold pr-4">{tournament.teams.find(t => t.id === match.homeTeamId)?.name}</div>
                        <div className="flex flex-col items-center bg-secondary/30 rounded-lg px-6 py-2 min-w-[140px]">
                          <div className="text-2xl font-bold">{match.status === 'Completed' ? `${match.homeScore} - ${match.awayScore}` : 'VS'}</div>
                          <span className="text-[10px] opacity-60 uppercase">{isMounted ? match.date.toLocaleDateString() : '...'}</span>
                        </div>
                        <div className="flex-1 text-left font-semibold pl-4">{tournament.teams.find(t => t.id === match.awayTeamId)?.name}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="stats" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-yellow-500" /> Máximos Goleadores</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Jugador</TableHead><TableHead className="text-right">Goles</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {topScorers.map(p => (
                        <TableRow key={p.id}>
                          <TableCell>{p.name} <div className="text-[10px] text-muted-foreground">{p.teamName}</div></TableCell>
                          <TableCell className="text-right font-bold text-primary">{p.goals}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
             </Card>
             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-500" /> Disciplina</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Jugador</TableHead><TableHead className="text-center">A</TableHead><TableHead className="text-center">R</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {allPlayers.filter(p => p.yellowCards > 0 || p.redCards > 0).map(p => (
                        <TableRow key={p.id}>
                          <TableCell>{p.name}</TableCell>
                          <TableCell className="text-center">{p.yellowCards}</TableCell>
                          <TableCell className="text-center text-red-600 font-bold">{p.redCards}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="teams" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tournament.teams.map(team => (
              <Card key={team.id} className="text-center p-6">
                <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4"><Users className="opacity-20" /></div>
                <h3 className="font-bold">{team.name}</h3>
                <p className="text-sm text-muted-foreground">{team.players.length} Jugadores</p>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
