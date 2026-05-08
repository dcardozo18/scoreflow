
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
  ChevronRight,
  ClipboardCheck,
  Search
} from 'lucide-react';
import { mockTournaments } from '@/app/lib/mock-store';
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
import { TournamentFormat, SchedulingPreferences, Match, Team, Player } from '@/app/lib/types';
import { generateLeagueMatches } from '@/app/lib/scheduler-utils';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const DAYS = [
  { id: 0, label: 'Dom' },
  { id: 1, label: 'Lun' },
  { id: 2, label: 'Mar' },
  { id: 3, label: 'Mié' },
  { id: 4, label: 'Jue' },
  { id: 5, label: 'Vie' },
  { id: 6, label: 'Sáb' },
];

export default function TournamentManagement() {
  const params = useParams();
  const { toast } = useToast();
  const tournamentId = params.id as string;
  const initialTournament = mockTournaments.find(t => t.id === tournamentId);
  
  const [isMounted, setIsMounted] = useState(false);
  const [tournament, setTournament] = useState(initialTournament);
  const [aiLoading, setAiLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modals state
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [recordingMatch, setRecordingMatch] = useState<Match | null>(null);
  const [matchScore, setMatchScore] = useState({ home: 0, away: 0 });

  const [schedPrefs, setSchedPrefs] = useState<SchedulingPreferences>(
    tournament?.schedulingPreferences || {
      allowedDays: [5, 6, 0],
      startTime: '08:00',
      endTime: '20:00',
      matchDurationMinutes: 90
    }
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!tournament) return <div className="p-10 text-center">Torneo no encontrado.</div>;

  const groupedMatches = tournament.matches.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const roundNumbers = Object.keys(groupedMatches).map(Number).sort((a, b) => a - b);

  // --- Handlers ---

  const handleSaveMatchResult = () => {
    if (!recordingMatch) return;
    
    const updatedMatches = tournament.matches.map(m => 
      m.id === recordingMatch.id 
        ? { ...m, status: 'Completed' as const, homeScore: matchScore.home, awayScore: matchScore.away }
        : m
    );

    setTournament({ ...tournament, matches: updatedMatches });
    setRecordingMatch(null);
    toast({ title: "Resultado Guardado", description: "El marcador ha sido actualizado exitosamente." });
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

  const handleAddPlayer = (teamId: string) => {
    const newPlayer: Player = {
      id: `p-${Date.now()}`,
      name: "Nuevo Jugador",
      number: 0,
      position: "N/A",
      goals: 0,
      yellowCards: 0,
      redCards: 0
    };
    const updatedTeams = tournament.teams.map(team => 
      team.id === teamId ? { ...team, players: [...team.players, newPlayer] } : team
    );
    setTournament({ ...tournament, teams: updatedTeams });
    // Update editing team for the modal
    const updatedTeam = updatedTeams.find(t => t.id === teamId);
    if (updatedTeam) setEditingTeam(updatedTeam);
  };

  const handleGenerateSummary = async () => {
    setAiLoading(true);
    try {
      const result = await generateTournamentSummary({
        tournamentName: tournament.name,
        tournamentDescription: tournament.description,
        teams: tournament.teams.map((t, idx) => ({ name: t.name, rank: idx + 1 })),
        matchHighlights: tournament.matches.filter(m => m.status === 'Completed').map(m => ({ 
          matchDescription: `${tournament.teams.find(t => t.id === m.homeTeamId)?.name} vs ${tournament.teams.find(t => t.id === m.awayTeamId)?.name}: ${m.homeScore}-${m.awayScore}` 
        })),
        winnerTeam: tournament.teams[0]?.name
      });
      
      setTournament({ ...tournament, aiSummary: result.summary });
      toast({ title: "Resumen Generado", description: "La IA ha analizado los resultados actuales." });
    } catch (err) {
      toast({ title: "Error", description: "No se pudo generar el resumen por IA.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAutoSchedule = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newMatches = generateLeagueMatches(
        tournament.id,
        tournament.teams,
        tournament.startDate,
        tournament.isHomeAndAway,
        schedPrefs
      );
      setTournament(prev => prev ? { ...prev, matches: newMatches } : prev);
      setIsGenerating(false);
      toast({
        title: "Calendario Creado",
        description: `Se han generado ${newMatches.length} partidos.`,
      });
    }, 800);
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
            <p className="text-muted-foreground text-sm">Consola de Administración</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline">Previsualizar</Button>
           <Button className="shadow-lg"><Save className="h-4 w-4 mr-2" /> Guardar Todo</Button>
        </div>
      </div>

      <Tabs defaultValue="matches" className="space-y-6">
        <TabsList className="bg-white p-1 border shadow-sm">
          <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Configuración</TabsTrigger>
          <TabsTrigger value="matches" className="gap-2"><List className="h-4 w-4" /> Resultados</TabsTrigger>
          <TabsTrigger value="teams" className="gap-2"><Users className="h-4 w-4" /> Equipos</TabsTrigger>
          <TabsTrigger value="scheduler" className="gap-2"><CalendarIcon className="h-4 w-4" /> Programación Auto</TabsTrigger>
          <TabsTrigger value="ai" className="gap-2"><Sparkles className="h-4 w-4" /> IA</TabsTrigger>
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
                      <SelectItem value="LeagueKnockout">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/20">
                  <Label className="flex items-center gap-2"><Repeat className="h-4 w-4" /> Ida y Vuelta</Label>
                  <Switch checked={tournament.isHomeAndAway} onCheckedChange={(v) => setTournament({...tournament, isHomeAndAway: v})} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-10">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Cronograma por Fechas</h3>
            <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" /> Añadir Partido Manual</Button>
          </div>
          {roundNumbers.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed rounded-2xl bg-white">
               <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
               <p className="text-muted-foreground font-medium">No hay partidos en el calendario.</p>
               <p className="text-sm text-muted-foreground/60">Usa el Generador Automático o añade uno manualmente.</p>
            </div>
          ) : (
            roundNumbers.map(roundNum => (
              <div key={roundNum} className="space-y-4">
                <h4 className="font-bold text-primary flex items-center gap-2">
                  <Badge className="bg-primary px-3">Fecha {roundNum}</Badge>
                </h4>
                <div className="grid gap-3">
                  {groupedMatches[roundNum].map(match => (
                    <Card key={match.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center gap-6">
                        <div className="flex-1 text-right font-bold text-lg text-primary truncate">
                          {tournament.teams.find(t => t.id === match.homeTeamId)?.name}
                        </div>
                        <div className="flex flex-col items-center gap-1 min-w-[120px]">
                          {match.status === 'Completed' ? (
                            <div className="text-2xl font-black tracking-widest bg-secondary/30 px-4 py-1 rounded">
                              {match.homeScore} - {match.awayScore}
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="w-full gap-2 font-bold"
                              onClick={() => {
                                setRecordingMatch(match);
                                setMatchScore({ home: 0, away: 0 });
                              }}
                            >
                              <ClipboardCheck className="h-4 w-4" /> Registrar
                            </Button>
                          )}
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                            {isMounted ? match.date.toLocaleDateString() : '...'}
                          </span>
                        </div>
                        <div className="flex-1 text-left font-bold text-lg text-primary truncate">
                          {tournament.teams.find(t => t.id === match.awayTeamId)?.name}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Settings className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive h-8 w-8"><Trash2 className="h-3 w-3" /></Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournament.teams.map(team => (
              <Card key={team.id} className="overflow-hidden group">
                <CardHeader className="bg-secondary/10 border-b pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-primary">{team.name}</CardTitle>
                    <Badge variant="outline">{team.players.length} Jugadores</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> {team.players.reduce((sum, p) => sum + p.goals, 0)} Goles</span>
                    <span className="flex items-center gap-1"><Badge variant="outline" className="h-3 p-0 px-1 text-[8px] bg-yellow-400">Y</Badge> {team.players.reduce((sum, p) => sum + p.yellowCards, 0)}</span>
                    <span className="flex items-center gap-1"><Badge variant="outline" className="h-3 p-0 px-1 text-[8px] bg-red-500 text-white">R</Badge> {team.players.reduce((sum, p) => sum + p.redCards, 0)}</span>
                  </div>
                  <Button 
                    className="w-full gap-2" 
                    variant="outline"
                    onClick={() => setEditingTeam(team)}
                  >
                    <Users className="h-4 w-4" /> Gestionar Jugadores
                  </Button>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" className="h-auto border-dashed flex-col py-10 gap-3 opacity-60 hover:opacity-100 transition-opacity">
              <Plus className="h-8 w-8" />
              <span>Añadir Equipo</span>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="scheduler" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-accent" /> Generador Inteligente</CardTitle>
              <CardDescription>Planifica toda la fase automáticamente respetando tus horarios de disponibilidad.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <Label className="text-primary font-bold">Días de Competencia</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {DAYS.map((day) => (
                      <div key={day.id} className={`flex items-center space-x-2 border p-3 rounded-lg transition-colors ${schedPrefs.allowedDays.includes(day.id) ? 'bg-primary/5 border-primary/30' : 'bg-white'}`}>
                        <Checkbox 
                          id={`day-${day.id}`}
                          checked={schedPrefs.allowedDays.includes(day.id)} 
                          onCheckedChange={(c) => setSchedPrefs(p => ({...p, allowedDays: c ? [...p.allowedDays, day.id] : p.allowedDays.filter(d => d !== day.id)}))} 
                        />
                        <Label htmlFor={`day-${day.id}`} className="text-xs cursor-pointer">{day.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <Label className="text-primary font-bold">Ventana Horaria</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase text-muted-foreground font-bold">Primer Turno</Label>
                      <Input type="time" value={schedPrefs.startTime} onChange={(e) => setSchedPrefs(p => ({ ...p, startTime: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase text-muted-foreground font-bold">Cierre Máximo</Label>
                      <Input type="time" value={schedPrefs.endTime} onChange={(e) => setSchedPrefs(p => ({ ...p, endTime: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">Duración + Descanso (min)</Label>
                    <Input type="number" value={schedPrefs.matchDurationMinutes} onChange={(e) => setSchedPrefs(p => ({ ...p, matchDurationMinutes: parseInt(e.target.value) }))} />
                  </div>
                </div>
              </div>
              <Button onClick={handleAutoSchedule} className="w-full h-12 text-lg font-bold shadow-lg" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Wand2 className="h-5 w-5 mr-2" />}
                Generar Calendario de Partidos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai" className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Crónica Deportiva</CardTitle>
              <CardDescription>Genera un resumen narrativo basado en los resultados de los partidos jugados.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-[200px] flex flex-col items-center justify-center p-8 bg-white rounded-xl border-2 border-dashed gap-6">
                {tournament.aiSummary ? (
                   <div className="space-y-4">
                     <p className="italic text-primary text-center text-lg leading-relaxed">"{tournament.aiSummary}"</p>
                     <div className="flex justify-center">
                        <Button variant="ghost" size="sm" onClick={handleGenerateSummary} disabled={aiLoading}>
                           <Repeat className="h-4 w-4 mr-2" /> Regenerar
                        </Button>
                     </div>
                   </div>
                ) : (
                   <div className="text-center space-y-4">
                     <Sparkles className="h-12 w-12 text-primary/20 mx-auto" />
                     <p className="text-muted-foreground">La IA redactará una reseña de lo ocurrido en el torneo.</p>
                     <Button onClick={handleGenerateSummary} disabled={aiLoading}>
                       {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                       Generar Crónica
                     </Button>
                   </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- MODAL: Gestionar Jugadores --- */}
      <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-secondary/20 border-b">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-2xl text-primary font-bold">{editingTeam?.name}</DialogTitle>
                <DialogDescription>Gestiona los jugadores, números y estadísticas históricas.</DialogDescription>
              </div>
              <Button onClick={() => editingTeam && handleAddPlayer(editingTeam.id)} variant="default" size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" /> Nuevo Jugador
              </Button>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {editingTeam?.players.map((player) => (
                <div key={player.id} className="grid grid-cols-12 gap-3 items-end p-4 border rounded-xl bg-card hover:bg-secondary/5 transition-colors">
                  <div className="col-span-1">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground">Dorsal</Label>
                    <Input 
                      type="number" 
                      className="h-9 px-2 text-center" 
                      value={player.number} 
                      onChange={(e) => editingTeam && handleUpdatePlayerStat(editingTeam.id, player.id, 'number', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="col-span-4">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground">Nombre Completo</Label>
                    <Input 
                      className="h-9" 
                      value={player.name} 
                      onChange={(e) => {
                        const updatedTeams = tournament.teams.map(t => 
                          t.id === editingTeam.id 
                            ? { ...t, players: t.players.map(p => p.id === player.id ? { ...p, name: e.target.value } : p) }
                            : t
                        );
                        setTournament({...tournament, teams: updatedTeams});
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground">Goles</Label>
                    <Input 
                      type="number" 
                      className="h-9" 
                      value={player.goals} 
                      onChange={(e) => editingTeam && handleUpdatePlayerStat(editingTeam.id, player.id, 'goals', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground">Amanillas</Label>
                    <Input 
                      type="number" 
                      className="h-9 border-yellow-300" 
                      value={player.yellowCards} 
                      onChange={(e) => editingTeam && handleUpdatePlayerStat(editingTeam.id, player.id, 'yellowCards', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground">Rojas</Label>
                    <Input 
                      type="number" 
                      className="h-9 border-red-300" 
                      value={player.redCards} 
                      onChange={(e) => editingTeam && handleUpdatePlayerStat(editingTeam.id, player.id, 'redCards', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <DialogFooter className="p-4 border-t bg-secondary/5">
            <Button variant="outline" onClick={() => setEditingTeam(null)}>Cerrar Ventana</Button>
            <Button onClick={() => setEditingTeam(null)}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL: Registrar Resultado --- */}
      <Dialog open={!!recordingMatch} onOpenChange={(open) => !open && setRecordingMatch(null)}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-primary/5 border-b">
            <DialogTitle className="text-xl font-bold flex items-center justify-center gap-4">
              {tournament.teams.find(t => t.id === recordingMatch?.homeTeamId)?.name} 
              <span className="text-muted-foreground italic">vs</span> 
              {tournament.teams.find(t => t.id === recordingMatch?.awayTeamId)?.name}
            </DialogTitle>
            <DialogDescription className="text-center">Registra el marcador final y el desempeño individual.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8">
              {/* Score Inputs */}
              <div className="flex items-center justify-center gap-12 py-6 bg-secondary/10 rounded-2xl border">
                 <div className="text-center space-y-3">
                   <Label className="font-bold text-primary block">LOCAL</Label>
                   <Input 
                    type="number" 
                    className="w-24 h-20 text-center text-4xl font-black rounded-xl border-2" 
                    value={matchScore.home}
                    onChange={(e) => setMatchScore({...matchScore, home: parseInt(e.target.value) || 0})}
                   />
                 </div>
                 <div className="text-5xl font-thin text-muted-foreground opacity-30 mt-8">-</div>
                 <div className="text-center space-y-3">
                   <Label className="font-bold text-primary block">VISITANTE</Label>
                   <Input 
                    type="number" 
                    className="w-24 h-20 text-center text-4xl font-black rounded-xl border-2" 
                    value={matchScore.away}
                    onChange={(e) => setMatchScore({...matchScore, away: parseInt(e.target.value) || 0})}
                   />
                 </div>
              </div>

              {/* Player Stats during match */}
              <div className="grid grid-cols-2 gap-8">
                {/* Home Team Stats */}
                <div className="space-y-4">
                  <h5 className="font-bold text-primary text-sm flex items-center gap-2 border-b pb-2">
                    <Users className="h-4 w-4" /> Jugadores: {tournament.teams.find(t => t.id === recordingMatch?.homeTeamId)?.name}
                  </h5>
                  <div className="space-y-2">
                    {tournament.teams.find(t => t.id === recordingMatch?.homeTeamId)?.players.map(p => (
                      <div key={p.id} className="flex items-center gap-2 p-2 border rounded-lg bg-card text-xs">
                        <span className="w-6 font-bold text-muted-foreground">{p.number}</span>
                        <span className="flex-1 font-medium">{p.name}</span>
                        <div className="flex gap-2 items-center">
                          <div className="flex flex-col items-center">
                            <Label className="text-[8px] uppercase font-bold text-muted-foreground">Goles</Label>
                            <Input 
                              type="number" 
                              className="h-8 w-12 px-1 text-center" 
                              value={p.goals} 
                              onChange={(e) => recordingMatch && handleUpdatePlayerStat(recordingMatch.homeTeamId, p.id, 'goals', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 border-yellow-400 bg-yellow-50 mt-4"
                            onClick={() => recordingMatch && handleUpdatePlayerStat(recordingMatch.homeTeamId, p.id, 'yellowCards', p.yellowCards + 1)}
                            title="Amarilla"
                          >
                            <span className="text-[10px] font-bold">Y</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 border-red-500 bg-red-50 mt-4"
                            onClick={() => recordingMatch && handleUpdatePlayerStat(recordingMatch.homeTeamId, p.id, 'redCards', p.redCards + 1)}
                            title="Roja"
                          >
                            <span className="text-[10px] font-bold text-red-600">R</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Away Team Stats */}
                <div className="space-y-4">
                  <h5 className="font-bold text-primary text-sm flex items-center gap-2 border-b pb-2">
                    <Users className="h-4 w-4" /> Jugadores: {tournament.teams.find(t => t.id === recordingMatch?.awayTeamId)?.name}
                  </h5>
                  <div className="space-y-2">
                    {tournament.teams.find(t => t.id === recordingMatch?.awayTeamId)?.players.map(p => (
                      <div key={p.id} className="flex items-center gap-2 p-2 border rounded-lg bg-card text-xs">
                        <span className="w-6 font-bold text-muted-foreground">{p.number}</span>
                        <span className="flex-1 font-medium">{p.name}</span>
                        <div className="flex gap-2 items-center">
                          <div className="flex flex-col items-center">
                            <Label className="text-[8px] uppercase font-bold text-muted-foreground">Goles</Label>
                            <Input 
                              type="number" 
                              className="h-8 w-12 px-1 text-center" 
                              value={p.goals} 
                              onChange={(e) => recordingMatch && handleUpdatePlayerStat(recordingMatch.awayTeamId, p.id, 'goals', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 border-yellow-400 bg-yellow-50 mt-4"
                            onClick={() => recordingMatch && handleUpdatePlayerStat(recordingMatch.awayTeamId, p.id, 'yellowCards', p.yellowCards + 1)}
                            title="Amarilla"
                          >
                            <span className="text-[10px] font-bold">Y</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 border-red-500 bg-red-50 mt-4"
                            onClick={() => recordingMatch && handleUpdatePlayerStat(recordingMatch.awayTeamId, p.id, 'redCards', p.redCards + 1)}
                            title="Roja"
                          >
                            <span className="text-[10px] font-bold text-red-600">R</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 border-t bg-secondary/5 gap-3">
             <Button variant="ghost" onClick={() => setRecordingMatch(null)}>Cancelar</Button>
             <Button onClick={handleSaveMatchResult} className="gap-2 px-8 font-bold">
               <CheckCircle2 className="h-4 w-4" /> Finalizar y Guardar
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
