
"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  List, 
  Settings, 
  Plus, 
  Save, 
  Sparkles,
  Loader2,
  Trash2,
  CheckCircle2,
  Repeat,
  Calendar as CalendarIcon,
  Wand2,
  UserPlus,
  ClipboardCheck,
  Edit2,
  AlertTriangle,
  Clock,
  FileDown,
  BarChart3,
  Award,
  AlertCircle,
  LayoutGrid
} from 'lucide-react';
import { calculateStandings } from '@/app/lib/mock-store';
import { db } from '@/lib/services/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { generateTournamentSummary } from '@/ai/flows/generate-tournament-summary-flow';
import { TournamentFormat, SchedulingPreferences, Match, Team, Player, Tournament } from '@/app/lib/types';
import { generateLeagueMatches } from '@/app/lib/scheduler-utils';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

const DAYS = [
  { id: 0, label: 'Dom' },
  { id: 1, label: 'Lun' },
  { id: 2, label: 'Mar' },
  { id: 3, label: 'Mié' },
  { id: 4, label: 'Jue' },
  { id: 5, label: 'Vie' },
  { id: 6, label: 'Sáb' },
];

type DeleteState = {
  type: 'match' | 'team' | 'player' | 'round';
  id: string;
  extraId?: string; 
} | null;

export default function TournamentManagement() {
  const params = useParams();
  const { toast } = useToast();
  const tournamentId = params.id as string;
  
  const [isMounted, setIsMounted] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [recordingMatch, setRecordingMatch] = useState<Match | null>(null);
  const [reschedulingMatch, setReschedulingMatch] = useState<Match | null>(null);
  const [matchScore, setMatchScore] = useState({ home: 0, away: 0 });
  const [itemToDelete, setItemToDelete] = useState<DeleteState>(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState("");
  
  const [newMatchDate, setNewMatchDate] = useState('');
  const [newMatchTime, setNewMatchTime] = useState('');

  const [schedPrefs, setSchedPrefs] = useState<SchedulingPreferences>({
    allowedDays: [5, 6, 0],
    startTime: '08:00',
    endTime: '20:00',
    matchDurationMinutes: 90
  });

  useEffect(() => {
    setIsMounted(true);
    loadTournament();
  }, [tournamentId]);

  const loadTournament = async () => {
    try {
      setLoading(true);
      const data = await db.getTournamentById(tournamentId);
      if (data) {
        setTournament(data);
        if (data.schedulingPreferences) setSchedPrefs(data.schedulingPreferences);
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar el torneo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const standings = useMemo(() => {
    if (!tournament) return [];
    return calculateStandings(tournament);
  }, [tournament]);

  const allPlayersWithStats = useMemo(() => {
    if (!tournament) return [];
    return tournament.teams.flatMap(team => 
      team.players.map(player => ({ ...player, teamName: team.name }))
    );
  }, [tournament]);

  const topScorers = useMemo(() => {
    return [...allPlayersWithStats].sort((a, b) => b.goals - a.goals).slice(0, 10);
  }, [allPlayersWithStats]);

  const topCards = useMemo(() => {
    return [...allPlayersWithStats]
      .filter(p => p.yellowCards > 0 || p.redCards > 0)
      .sort((a, b) => (b.redCards * 2 + b.yellowCards) - (a.redCards * 2 + a.yellowCards))
      .slice(0, 10);
  }, [allPlayersWithStats]);

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;
  if (!tournament) return <div className="p-10 text-center">Torneo no encontrado.</div>;

  const groupedMatches = tournament.matches.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const roundNumbers = Object.keys(groupedMatches).map(Number).sort((a, b) => a - b);

  const handleSaveTournamentSettings = async () => {
    try {
      await db.updateTournament(tournamentId, tournament);
      toast({ title: "Cambios guardados", description: "La configuración ha sido actualizada en la base de datos." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar la configuración.", variant: "destructive" });
    }
  };

  const handleSaveMatchResult = async () => {
    if (!recordingMatch) return;
    try {
      const updatedMatch = { ...recordingMatch, status: 'Completed' as const, homeScore: matchScore.home, awayScore: matchScore.away };
      await db.updateMatch(recordingMatch.id, updatedMatch);
      
      // Update players stats in DB
      const homeTeam = tournament.teams.find(t => t.id === recordingMatch.homeTeamId);
      const awayTeam = tournament.teams.find(t => t.id === recordingMatch.awayTeamId);
      if (homeTeam) await db.upsertPlayers(homeTeam.players, homeTeam.id);
      if (awayTeam) await db.upsertPlayers(awayTeam.players, awayTeam.id);

      await loadTournament();
      setRecordingMatch(null);
      toast({ title: "Resultado Guardado", description: "Marcador y estadísticas actualizadas exitosamente." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el resultado.", variant: "destructive" });
    }
  };

  const handleRescheduleMatch = async () => {
    if (!reschedulingMatch || !newMatchDate || !newMatchTime) return;
    try {
      const [year, month, day] = newMatchDate.split('-').map(Number);
      const [hours, minutes] = newMatchTime.split(':').map(Number);
      const date = new Date(year, month - 1, day, hours, minutes);
      await db.updateMatch(reschedulingMatch.id, { ...reschedulingMatch, date });
      await loadTournament();
      setReschedulingMatch(null);
      toast({ title: "Partido Reprogramado", description: "Fecha y hora actualizadas en la DB." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo reprogramar el partido.", variant: "destructive" });
    }
  };

  const handleUpdatePlayerStat = (teamId: string, playerId: string, field: keyof Player, value: number) => {
    const updatedTeams = tournament.teams.map(team => {
      if (team.id !== teamId) return team;
      return {
        ...team,
        players: team.players.map(p => 
          p.id === playerId ? { ...p, [field]: value } : p
        )
      };
    });
    setTournament({ ...tournament, teams: updatedTeams });
  };

  const handleAddPlayer = async (teamId: string) => {
    try {
      const newPlayer: Partial<Player> = {
        name: "Nuevo Jugador",
        number: 0,
        position: "N/A",
        goals: 0,
        yellowCards: 0,
        redCards: 0
      };
      await db.upsertPlayers([newPlayer], teamId);
      await loadTournament();
      const updatedTeam = tournament.teams.find(t => t.id === teamId);
      if (updatedTeam) setEditingTeam(updatedTeam);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo añadir el jugador.", variant: "destructive" });
    }
  };

  const handleBulkAddPlayers = async () => {
    if (!editingTeam || !bulkText.trim()) return;
    try {
      const lines = bulkText.split('\n');
      const newPlayers: Partial<Player>[] = lines.map(line => {
        const parts = line.split(',');
        return {
          name: parts[0]?.trim() || "Jugador",
          number: parseInt(parts[1]?.trim()) || 0,
          position: parts[2]?.trim() || "N/A"
        };
      }).filter(p => p.name);

      await db.upsertPlayers(newPlayers, editingTeam.id);
      await loadTournament();
      setEditingTeam(tournament.teams.find(t => t.id === editingTeam.id) || null);
      setBulkText("");
      setShowBulkAdd(false);
      toast({ title: "Carga Completada", description: "Plantilla actualizada en la base de datos." });
    } catch (error) {
      toast({ title: "Error", description: "Falló la carga masiva.", variant: "destructive" });
    }
  };

  const handleAddTeam = async () => {
    try {
      const newTeam = await db.createTeam({ name: `Nuevo Equipo ${tournament.teams.length + 1}`, tournamentId });
      await loadTournament();
      setEditingTeam(newTeam);
      toast({ title: "Equipo Creado", description: "Se ha añadido un nuevo equipo a Supabase." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo crear el equipo.", variant: "destructive" });
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'match') {
        await db.deleteMatch(itemToDelete.id);
        toast({ title: "Partido Eliminado" });
      } else if (itemToDelete.type === 'round') {
        const roundNum = parseInt(itemToDelete.id);
        const matchesToDelete = tournament.matches.filter(m => m.round === roundNum);
        await Promise.all(matchesToDelete.map(m => db.deleteMatch(m.id)));
        toast({ title: "Fecha Eliminada" });
      } else if (itemToDelete.type === 'team') {
        await db.deleteTeam(itemToDelete.id);
        toast({ title: "Equipo Eliminado" });
      } else if (itemToDelete.type === 'player' && itemToDelete.extraId) {
        await db.deletePlayer(itemToDelete.extraId);
        toast({ title: "Jugador Eliminado" });
      }
      await loadTournament();
      setItemToDelete(null);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo completar la eliminación.", variant: "destructive" });
    }
  };

  const handleAutoSchedule = async () => {
    setIsGenerating(true);
    try {
      const newMatches = generateLeagueMatches(
        tournament.id,
        tournament.teams,
        tournament.startDate,
        tournament.isHomeAndAway,
        schedPrefs
      );
      await db.upsertMatches(newMatches, tournamentId);
      await loadTournament();
      toast({ title: "Calendario Generado", description: "Partidos guardados en la DB." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo generar el calendario.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">{tournament.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
              {tournament.format}
            </span>
            <p className="text-muted-foreground text-sm">Consola de Administración (Supabase)</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" asChild><a href={`/tournament/${tournamentId}`} target="_blank">Vista Pública</a></Button>
           <Button className="shadow-lg" onClick={handleSaveTournamentSettings}><Save className="h-4 w-4 mr-2" /> Guardar Cambios</Button>
        </div>
      </div>

      <Tabs defaultValue="matches" className="space-y-6">
        <TabsList className="bg-white p-1 border shadow-sm h-auto flex-wrap">
          <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Configuración</TabsTrigger>
          <TabsTrigger value="matches" className="gap-2"><List className="h-4 w-4" /> Resultados</TabsTrigger>
          <TabsTrigger value="teams" className="gap-2"><Users className="h-4 w-4" /> Equipos</TabsTrigger>
          <TabsTrigger value="standings" className="gap-2"><LayoutGrid className="h-4 w-4" /> Tabla Posiciones</TabsTrigger>
          <TabsTrigger value="stats" className="gap-2"><BarChart3 className="h-4 w-4" /> Estadísticas</TabsTrigger>
          <TabsTrigger value="scheduler" className="gap-2"><CalendarIcon className="h-4 w-4" /> Programación Auto</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Parámetros Generales</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tipo de Torneo</Label>
                  <Select value={tournament.format} onValueChange={(v: TournamentFormat) => setTournament({...tournament, format: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="League">Liga</SelectItem>
                      <SelectItem value="Knockout">Eliminatoria</SelectItem>
                      <SelectItem value="Groups">Grupos</SelectItem>
                      <SelectItem value="LeagueKnockout">Liga + Eliminatoria (Mixto)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad Máxima de Equipos</Label>
                  <Input 
                    type="number" 
                    value={tournament.maxTeams} 
                    onChange={(e) => setTournament({...tournament, maxTeams: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              {tournament.format === 'LeagueKnockout' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-xl bg-accent/5 border-accent/20 animate-in fade-in">
                  <div className="space-y-2">
                    <Label className="text-accent font-bold">Equipos que clasifican a la eliminatoria</Label>
                    <Input 
                      type="number" 
                      value={tournament.qualifyingTeamsCount || ''}
                      onChange={(e) => setTournament({...tournament, qualifyingTeamsCount: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-accent font-bold">Rondas de eliminatoria</Label>
                    <Input 
                      type="number" 
                      value={tournament.knockoutRounds || ''}
                      onChange={(e) => setTournament({...tournament, knockoutRounds: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/20">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2 font-bold"><Repeat className="h-4 w-4" /> Ida y Vuelta</Label>
                  <p className="text-xs text-muted-foreground">¿Se juegan dos partidos por cada enfrentamiento?</p>
                </div>
                <Switch checked={tournament.isHomeAndAway} onCheckedChange={(v) => setTournament({...tournament, isHomeAndAway: v})} />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-lg font-bold">Sistema de Puntuación</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Puntos por Victoria</Label>
                    <Input type="number" value={tournament.pointsPerWin} onChange={(e) => setTournament({...tournament, pointsPerWin: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Puntos por Empate</Label>
                    <Input type="number" value={tournament.pointsPerDraw} onChange={(e) => setTournament({...tournament, pointsPerDraw: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Puntos por Derrota</Label>
                    <Input type="number" value={tournament.pointsPerLoss} onChange={(e) => setTournament({...tournament, pointsPerLoss: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-10">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Cronograma por Fechas</h3>
          </div>
          {roundNumbers.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed rounded-2xl bg-white">
               <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
               <p className="text-muted-foreground font-medium">No hay partidos en el calendario.</p>
               <Button variant="link" onClick={() => handleAutoSchedule()}>Generar automáticamente</Button>
            </div>
          ) : (
            roundNumbers.map(roundNum => (
              <div key={roundNum} className="space-y-4">
                <div className="flex justify-between items-center">
                  <Badge className="bg-primary px-3 text-sm">Fecha {roundNum}</Badge>
                  <Button variant="ghost" size="sm" className="text-destructive gap-1" onClick={() => setItemToDelete({ type: 'round', id: roundNum.toString() })}>
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar Fecha
                  </Button>
                </div>
                <div className="grid gap-3">
                  {groupedMatches[roundNum].map(match => (
                    <Card key={match.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center gap-6">
                        <div className="flex-1 text-right font-bold text-lg text-primary truncate">
                          {tournament.teams.find(t => t.id === match.homeTeamId)?.name}
                        </div>
                        <div className="flex flex-col items-center gap-1 min-w-[120px]">
                          {match.status === 'Completed' ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="text-2xl font-black tracking-widest bg-secondary/30 px-4 py-1 rounded">
                                {match.homeScore} - {match.awayScore}
                              </div>
                              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" onClick={() => {
                                setRecordingMatch(match);
                                setMatchScore({ home: match.homeScore || 0, away: match.awayScore || 0 });
                              }}>
                                <Edit2 className="h-3 w-3" /> Editar Resultado
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="secondary" className="w-full gap-2 font-bold" onClick={() => {
                                setRecordingMatch(match);
                                setMatchScore({ home: 0, away: 0 });
                              }}>
                              <ClipboardCheck className="h-4 w-4" /> Registrar
                            </Button>
                          )}
                          <span className="text-[10px] text-muted-foreground font-bold">
                            {isMounted ? match.date.toLocaleDateString() : '...'} - {isMounted ? match.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                          </span>
                        </div>
                        <div className="flex-1 text-left font-bold text-lg text-primary truncate">
                          {tournament.teams.find(t => t.id === match.awayTeamId)?.name}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              setReschedulingMatch(match);
                              if (isMounted) {
                                const d = match.date;
                                setNewMatchDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                                setNewMatchTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
                              }
                            }}>
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => setItemToDelete({ type: 'match', id: match.id })}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Equipos</h3>
            <Button onClick={handleAddTeam} className="gap-2"><Plus className="h-4 w-4" /> Añadir Equipo</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournament.teams.map(team => (
              <Card key={team.id} className="overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-primary truncate">{team.name}</CardTitle>
                    <div className="flex gap-1">
                       <Badge variant="outline">{team.players.length} Jugadores</Badge>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setItemToDelete({ type: 'team', id: team.id })}>
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <Button className="w-full gap-2" variant="outline" onClick={() => setEditingTeam(team)}>
                    <Edit2 className="h-4 w-4" /> Gestionar Plantilla
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="standings" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Tabla de Clasificación Real</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pos</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead className="text-center">PJ</TableHead>
                    <TableHead className="text-center">G</TableHead>
                    <TableHead className="text-center">E</TableHead>
                    <TableHead className="text-center">P</TableHead>
                    <TableHead className="text-center font-bold">Pts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((entry, idx) => (
                    <TableRow key={entry.teamId}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-bold">{entry.teamName}</TableCell>
                      <TableCell className="text-center">{entry.played}</TableCell>
                      <TableCell className="text-center">{entry.won}</TableCell>
                      <TableCell className="text-center">{entry.drawn}</TableCell>
                      <TableCell className="text-center">{entry.lost}</TableCell>
                      <TableCell className="text-center font-bold text-accent">{entry.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-yellow-500" /> Goleadores</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jugador</TableHead>
                      <TableHead className="text-right">Goles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topScorers.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.name} <span className="text-xs text-muted-foreground">({p.teamName})</span></TableCell>
                        <TableCell className="text-right font-bold">{p.goals}</TableCell>
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
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jugador</TableHead>
                      <TableHead className="text-center">A</TableHead>
                      <TableHead className="text-center">R</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCards.map(p => (
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
          </div>
        </TabsContent>

        <TabsContent value="scheduler" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Programación Automática</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleAutoSchedule} className="w-full h-12 text-lg font-bold" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Wand2 className="h-5 w-5 mr-2" />}
                Generar y Guardar en Supabase
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODALS (Reprogramar, Editar Equipo, Registro de Partido, Confirmaciones) */}
      <Dialog open={!!reschedulingMatch} onOpenChange={(open) => !open && setReschedulingMatch(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reprogramar Partido</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Fecha</Label>
              <Input type="date" className="col-span-3" value={newMatchDate} onChange={(e) => setNewMatchDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Hora</Label>
              <Input type="time" className="col-span-3" value={newMatchTime} onChange={(e) => setNewMatchTime(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleRescheduleMatch}>Actualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
        <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-6 border-b">
            <div className="flex justify-between items-center mb-4">
              <DialogTitle>Gestionar {editingTeam?.name}</DialogTitle>
              <div className="flex gap-2">
                <Button onClick={() => setShowBulkAdd(true)} variant="outline" size="sm">Carga Masiva</Button>
                <Button onClick={() => editingTeam && handleAddPlayer(editingTeam.id)} size="sm">Añadir Jugador</Button>
              </div>
            </div>
            <Input 
              value={editingTeam?.name || ''} 
              onChange={(e) => {
                if (!editingTeam) return;
                const newName = e.target.value;
                setEditingTeam({ ...editingTeam, name: newName });
                db.updateTeam(editingTeam.id, { name: newName });
              }}
              placeholder="Nombre del club..."
            />
          </DialogHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {editingTeam?.players.map((player) => (
                <div key={player.id} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg">
                  <div className="col-span-2">
                    <Label className="text-[10px]">Dorsal</Label>
                    <Input type="number" className="h-8" value={player.number} onChange={(e) => editingTeam && handleUpdatePlayerStat(editingTeam.id, player.id, 'number', parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-6">
                    <Label className="text-[10px]">Nombre</Label>
                    <Input className="h-8" value={player.name} onChange={(e) => editingTeam && handleUpdatePlayerStat(editingTeam.id, player.id, 'name', 0)} />
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setItemToDelete({ type: 'player', id: editingTeam.id, extraId: player.id })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="p-4 border-t">
             <Button className="w-full" onClick={() => {
               if (editingTeam) {
                 db.upsertPlayers(editingTeam.players, editingTeam.id).then(() => {
                   loadTournament();
                   setEditingTeam(null);
                 });
               }
             }}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkAdd} onOpenChange={setShowBulkAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Carga Masiva</DialogTitle></DialogHeader>
          <Textarea 
            placeholder="Nombre, Dorsal, Posición (uno por línea)" 
            className="min-h-[200px]"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <DialogFooter><Button onClick={handleBulkAddPlayers}>Procesar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!recordingMatch} onOpenChange={(open) => !open && setRecordingMatch(null)}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 bg-primary/5 border-b">
            <DialogTitle className="text-center">{tournament.teams.find(t => t.id === recordingMatch?.homeTeamId)?.name} vs {tournament.teams.find(t => t.id === recordingMatch?.awayTeamId)?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-center gap-12">
                 <Input type="number" className="w-20 h-20 text-center text-3xl font-black" value={matchScore.home} onChange={(e) => setMatchScore({...matchScore, home: parseInt(e.target.value) || 0})} />
                 <span className="text-4xl">-</span>
                 <Input type="number" className="w-20 h-20 text-center text-3xl font-black" value={matchScore.away} onChange={(e) => setMatchScore({...matchScore, away: parseInt(e.target.value) || 0})} />
              </div>
              <div className="grid grid-cols-2 gap-8">
                {['home', 'away'].map(side => {
                  const teamId = side === 'home' ? recordingMatch?.homeTeamId : recordingMatch?.awayTeamId;
                  const team = tournament.teams.find(t => t.id === teamId);
                  return (
                    <div key={side} className="space-y-4">
                      <h5 className="font-bold border-b pb-2">{team?.name}</h5>
                      {team?.players.map(p => (
                        <div key={p.id} className="flex items-center gap-2 p-2 border rounded text-xs">
                          <span className="w-4 font-bold">{p.number}</span>
                          <span className="flex-1">{p.name}</span>
                          <div className="flex gap-1">
                            {['goals', 'yellowCards', 'redCards'].map(stat => (
                              <Input key={stat} type="number" className="w-9 h-7 px-1 text-center" value={p[stat as keyof Player] as number} onChange={(e) => handleUpdatePlayerStat(teamId!, p.id, stat as keyof Player, parseInt(e.target.value) || 0)} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 border-t"><Button onClick={handleSaveMatchResult}>Guardar en la DB</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> ¿Confirmar?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción es irreversible en Supabase.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive">Sí, eliminar permanentemente</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
