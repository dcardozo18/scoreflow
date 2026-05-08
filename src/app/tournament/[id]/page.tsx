
"use client";

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Calendar, Users, ArrowLeft, Info, LayoutGrid, List, Award, AlertCircle } from 'lucide-react';
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

  // Get all players and sort for stats
  const allPlayers = tournament.teams.flatMap(team => 
    team.players.map(player => ({ ...player, teamName: team.name }))
  );
  
  const topScorers = [...allPlayers].sort((a, b) => b.goals - a.goals).slice(0, 10);
  const mostYellows = [...allPlayers].sort((a, b) => b.yellowCards - a.yellowCards).slice(0, 10);
  const mostReds = [...allPlayers].sort((a, b) => b.redCards - a.redCards).slice(0, 10);

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
                <div className="text-sm opacity-60">Equipos</div>
                <div className="text-2xl font-bold">{tournament.teams.length}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 px-6 text-center">
                <div className="text-sm opacity-60">Partidos</div>
                <div className="text-2xl font-bold">{tournament.matches.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        <Tabs defaultValue="standings" className="space-y-8">
          <div className="bg-white p-1 rounded-xl shadow-md inline-flex flex-wrap gap-1">
            <TabsList className="bg-transparent flex-wrap h-auto">
              <TabsTrigger value="standings" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" /> Posiciones
              </TabsTrigger>
              <TabsTrigger value="matches" className="flex items-center gap-2">
                <List className="h-4 w-4" /> Partidos
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <Award className="h-4 w-4" /> Estadísticas
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Equipos
              </TabsTrigger>
              {tournament.status === 'Completed' && (
                <TabsTrigger value="highlights" className="flex items-center gap-2">
                  <Info className="h-4 w-4" /> Resumen AI
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="standings" className="space-y-6">
            {tournament.format === 'League' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Tabla General</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Pos</TableHead>
                        <TableHead>Equipo</TableHead>
                        <TableHead className="text-center">PJ</TableHead>
                        <TableHead className="text-center">G</TableHead>
                        <TableHead className="text-center">E</TableHead>
                        <TableHead className="text-center">P</TableHead>
                        <TableHead className="text-center">DG</TableHead>
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
                <p className="text-muted-foreground">La visualización de llaves eliminatorias estará disponible pronto.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <div className="grid gap-4">
              {tournament.matches.sort((a, b) => a.date.getTime() - b.date.getTime()).map(match => {
                const homeTeam = tournament.teams.find(t => t.id === match.homeTeamId);
                const awayTeam = tournament.teams.find(t => t.id === match.awayTeamId);
                return (
                  <Card key={match.id} className="hover:border-accent/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 text-right font-semibold text-primary pr-4 truncate">{homeTeam?.name}</div>
                      <div className="flex flex-col items-center bg-secondary/30 rounded-lg px-6 py-2 min-w-[140px]">
                        <span className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-tighter">
                          {match.status === 'Completed' ? 'Finalizado' : match.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                        <div className="text-2xl font-bold tracking-widest text-primary">
                          {match.status === 'Completed' ? `${match.homeScore} - ${match.awayScore}` : 'VS'}
                        </div>
                        {match.status !== 'Completed' && (
                           <span className="text-[10px] text-muted-foreground mt-1">
                             {match.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        )}
                      </div>
                      <div className="flex-1 text-left font-semibold text-primary pl-4 truncate">{awayTeam?.name}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Scorers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" /> Máximos Goleadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jugador</TableHead>
                        <TableHead>Equipo</TableHead>
                        <TableHead className="text-right">Goles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topScorers.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-muted-foreground">{p.teamName}</TableCell>
                          <TableCell className="text-right font-bold text-primary">{p.goals}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Discipline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" /> Juego Limpio (Tarjetas)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jugador</TableHead>
                        <TableHead className="text-center">Amarillas</TableHead>
                        <TableHead className="text-center">Rojas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPlayers
                        .filter(p => p.yellowCards > 0 || p.redCards > 0)
                        .sort((a, b) => (b.redCards * 2 + b.yellowCards) - (a.redCards * 2 + a.yellowCards))
                        .slice(0, 10)
                        .map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">
                              {p.name}
                              <div className="text-[10px] text-muted-foreground">{p.teamName}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="inline-block w-4 h-6 bg-yellow-400 rounded-sm mx-auto shadow-sm" title="Amarillas"></div>
                              <span className="ml-2 font-bold">{p.yellowCards}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="inline-block w-4 h-6 bg-red-600 rounded-sm mx-auto shadow-sm" title="Rojas"></div>
                              <span className="ml-2 font-bold">{p.redCards}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tournament.teams.map(team => (
              <Card key={team.id} className="text-center p-6 hover:shadow-md transition-shadow">
                <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Users className="h-10 w-10 text-primary opacity-20" />
                  )}
                </div>
                <h3 className="font-bold text-lg text-primary">{team.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{team.players.length} Jugadores Inscritos</p>
                <div className="mt-4 pt-4 border-t grid grid-cols-3 text-xs">
                   <div>
                     <div className="font-bold text-primary">{team.players.reduce((acc, p) => acc + p.goals, 0)}</div>
                     <div className="text-[10px] text-muted-foreground uppercase">Goles</div>
                   </div>
                   <div>
                     <div className="font-bold text-yellow-600">{team.players.reduce((acc, p) => acc + p.yellowCards, 0)}</div>
                     <div className="text-[10px] text-muted-foreground uppercase">TA</div>
                   </div>
                   <div>
                     <div className="font-bold text-red-600">{team.players.reduce((acc, p) => acc + p.redCards, 0)}</div>
                     <div className="text-[10px] text-muted-foreground uppercase">TR</div>
                   </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="highlights">
             <Card className="bg-accent/5 border-accent/20">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Trophy className="h-5 w-5 text-accent" />
                   Resumen del Torneo por AI
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="prose prose-blue max-w-none">
                   <p className="text-lg leading-relaxed text-primary italic">
                     {tournament.aiSummary || "El resumen de este torneo aún se está generando. ¡Vuelve pronto!"}
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
