
"use client";

import { useParams } from 'next/navigation';
import { useState } from 'react';
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
  Clock,
  Wand2
} from 'lucide-react';
import { mockTournaments } from '@/app/lib/mock-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { generateTournamentSummary } from '@/ai/flows/generate-tournament-summary-flow';
import { TournamentFormat, SchedulingPreferences } from '@/app/lib/types';
import { generateLeagueMatches } from '@/app/lib/scheduler-utils';

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
  
  const [tournament, setTournament] = useState(initialTournament);
  const [aiLoading, setAiLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [schedPrefs, setSchedPrefs] = useState<SchedulingPreferences>(
    tournament?.schedulingPreferences || {
      allowedDays: [5, 6, 0], // Vie, Sáb, Dom por defecto
      startTime: '08:00',
      endTime: '20:00',
      matchDurationMinutes: 90
    }
  );

  if (!tournament) return <div>Tournament not found.</div>;

  const handleGenerateSummary = async () => {
    setAiLoading(true);
    try {
      const result = await generateTournamentSummary({
        tournamentName: tournament.name,
        tournamentDescription: tournament.description,
        teams: tournament.teams.map((t, idx) => ({ name: t.name, rank: idx + 1 })),
        matchHighlights: tournament.matches.map(m => ({ 
          matchDescription: `${tournament.teams.find(t => t.id === m.homeTeamId)?.name} vs ${tournament.teams.find(t => t.id === m.awayTeamId)?.name}: ${m.homeScore}-${m.awayScore}` 
        })),
        winnerTeam: tournament.teams[0]?.name
      });
      
      setTournament({ ...tournament, aiSummary: result.summary });
      toast({ title: "Resumen Generado", description: "La IA ha generado exitosamente los momentos destacados." });
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
        description: `Se han generado ${newMatches.length} partidos automáticamente.`,
      });
    }, 800);
  };

  const handleFormatChange = (value: TournamentFormat) => {
    setTournament(prev => prev ? { ...prev, format: value } : prev);
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
           <Button><Save className="h-4 w-4 mr-2" /> Guardar Cambios</Button>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="bg-white p-1 border">
          <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Configuración</TabsTrigger>
          <TabsTrigger value="matches" className="gap-2"><List className="h-4 w-4" /> Resultados</TabsTrigger>
          <TabsTrigger value="teams" className="gap-2"><Users className="h-4 w-4" /> Equipos</TabsTrigger>
          <TabsTrigger value="scheduler" className="gap-2"><CalendarIcon className="h-4 w-4" /> Programación Auto</TabsTrigger>
          <TabsTrigger value="ai" className="gap-2"><Sparkles className="h-4 w-4" /> Destacados IA</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Parámetros del Torneo</CardTitle>
                  <CardDescription>Define la estructura y reglas base de la competición.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Tipo de Torneo</Label>
                      <Select value={tournament.format} onValueChange={handleFormatChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona formato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="League">Solo Liga (Todos contra todos)</SelectItem>
                          <SelectItem value="Knockout">Eliminatoria Directa</SelectItem>
                          <SelectItem value="Groups">Por Grupos</SelectItem>
                          <SelectItem value="LeagueKnockout">Liga + Eliminatoria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Cantidad de Equipos (Capacidad)</Label>
                      <Input 
                        type="number" 
                        value={tournament.maxTeams} 
                        onChange={(e) => setTournament(prev => prev ? {...prev, maxTeams: parseInt(e.target.value)} : prev)}
                      />
                    </div>

                    {(tournament.format === 'Groups' || tournament.format === 'LeagueKnockout') && (
                      <div className="space-y-2">
                        <Label>Equipos que clasifican a sig. fase</Label>
                        <Input 
                          type="number" 
                          value={tournament.qualifyingTeamsCount || 0}
                          onChange={(e) => setTournament(prev => prev ? {...prev, qualifyingTeamsCount: parseInt(e.target.value)} : prev)}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/20">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2 text-base">
                          <Repeat className="h-4 w-4 text-accent" />
                          Ida y Vuelta
                        </Label>
                        <p className="text-xs text-muted-foreground">¿Se juegan dos partidos por enfrentamiento?</p>
                      </div>
                      <Switch 
                        checked={tournament.isHomeAndAway}
                        onCheckedChange={(checked) => setTournament(prev => prev ? {...prev, isHomeAndAway: checked} : prev)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre del Torneo</Label>
                    <Input value={tournament.name} onChange={(e) => setTournament(prev => prev ? {...prev, name: e.target.value} : prev)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input value={tournament.description} onChange={(e) => setTournament(prev => prev ? {...prev, description: e.target.value} : prev)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha Inicio</Label>
                      <Input type="date" value={tournament.startDate.toISOString().split('T')[0]} onChange={(e) => setTournament(prev => prev ? {...prev, startDate: new Date(e.target.value)} : prev)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select value={tournament.status} onValueChange={(v: any) => setTournament(prev => prev ? {...prev, status: v} : prev)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Upcoming">Próximo</SelectItem>
                          <SelectItem value="Active">Activo</SelectItem>
                          <SelectItem value="Completed">Finalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
               <Card className="bg-primary/5 border-primary/20">
                 <CardHeader>
                   <CardTitle className="text-lg">Resumen de Registro</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Equipos Inscritos:</span>
                      <span className="font-bold">{tournament.teams.length} / {tournament.maxTeams}</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all" 
                        style={{ width: `${(tournament.teams.length / tournament.maxTeams) * 100}%` }}
                      />
                    </div>
                    <div className="pt-4 border-t space-y-2">
                       <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                         <CheckCircle2 className="h-3 w-3" /> Formato validado
                       </div>
                    </div>
                 </CardContent>
               </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Calendario de Partidos</h3>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Programar Partido</Button>
          </div>
          <div className="grid gap-4">
            {tournament.matches.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-xl">
                 <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                 <p className="text-muted-foreground">No hay partidos programados. Usa la pestaña "Programación Auto" para generarlos.</p>
              </div>
            ) : (
              tournament.matches.map(match => (
                <Card key={match.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 text-right font-medium">{tournament.teams.find(t => t.id === match.homeTeamId)?.name}</div>
                    <div className="flex items-center gap-2">
                      <Input className="w-12 text-center font-bold h-8" defaultValue={match.homeScore} />
                      <span className="text-muted-foreground">-</span>
                      <Input className="w-12 text-center font-bold h-8" defaultValue={match.awayScore} />
                    </div>
                    <div className="flex-1 text-left font-medium">{tournament.teams.find(t => t.id === match.awayTeamId)?.name}</div>
                    <div className="text-xs text-muted-foreground w-40 text-right">
                      {match.date.toLocaleDateString()} {match.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Equipos Registrados</h3>
            <Button size="sm" disabled={tournament.teams.length >= tournament.maxTeams}>
              <Plus className="h-4 w-4 mr-2" /> Inscribir Equipo
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournament.teams.map(team => (
              <Card key={team.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold">{team.name}</h4>
                      <p className="text-xs text-muted-foreground">{team.players.length} Jugadores</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Ficha Técnica</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduler" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-accent" />
                Generador Automático de Calendario
              </CardTitle>
              <CardDescription>
                Configura los días y horas permitidos. La IA distribuirá todos los partidos del torneo automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-base">Días de Juego Permitidos</Label>
                  <div className="grid grid-cols-4 gap-4">
                    {DAYS.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2 border p-2 rounded-md hover:bg-secondary/50 transition-colors">
                        <Checkbox 
                          id={`day-${day.id}`} 
                          checked={schedPrefs.allowedDays.includes(day.id)}
                          onCheckedChange={(checked) => {
                            setSchedPrefs(prev => ({
                              ...prev,
                              allowedDays: checked 
                                ? [...prev.allowedDays, day.id]
                                : prev.allowedDays.filter(d => d !== day.id)
                            }));
                          }}
                        />
                        <label htmlFor={`day-${day.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                          {day.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> Hora Inicio</Label>
                      <Input 
                        type="time" 
                        value={schedPrefs.startTime} 
                        onChange={(e) => setSchedPrefs(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> Hora Fin Máx.</Label>
                      <Input 
                        type="time" 
                        value={schedPrefs.endTime}
                        onChange={(e) => setSchedPrefs(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Duración de Partido (minutos)</Label>
                    <Input 
                      type="number" 
                      value={schedPrefs.matchDurationMinutes}
                      onChange={(e) => setSchedPrefs(prev => ({ ...prev, matchDurationMinutes: parseInt(e.target.value) }))}
                    />
                    <p className="text-[10px] text-muted-foreground">Se añade automáticamente un descanso de 15 minutos entre partidos.</p>
                  </div>
                </div>
              </div>

              <div className="bg-accent/5 p-6 border border-accent/20 rounded-xl flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="font-bold text-primary">Listo para programar</p>
                    <p className="text-sm text-muted-foreground">Se generarán partidos para los {tournament.teams.length} equipos inscritos.</p>
                 </div>
                 <Button onClick={handleAutoSchedule} disabled={isGenerating || tournament.teams.length < 2}>
                   {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                   {tournament.matches.length > 0 ? 'Regenerar Calendario' : 'Generar Calendario Ahora'}
                 </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
           <Card className="border-accent/40 bg-accent/5">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Sparkles className="h-5 w-5 text-accent" />
                 Generador de Crónicas Deportivas
               </CardTitle>
               <CardDescription>
                 La IA analizará los resultados para crear una reseña emocionante de la competición.
               </CardDescription>
             </CardHeader>
             <CardContent>
                <div className="min-h-[200px] border-2 border-dashed border-accent/20 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                  {tournament.aiSummary ? (
                    <div className="text-left w-full space-y-4">
                       <p className="italic text-primary leading-relaxed">"{tournament.aiSummary}"</p>
                       <Button onClick={handleGenerateSummary} variant="outline" size="sm" disabled={aiLoading}>
                         {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                         Regenerar Crónica
                       </Button>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="h-12 w-12 text-accent opacity-20 mb-4" />
                      <p className="text-muted-foreground mb-6">Aún no hay una crónica generada. Ideal para torneos finalizados o en curso avanzado.</p>
                      <Button onClick={handleGenerateSummary} disabled={aiLoading}>
                        {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        Generar Resumen
                      </Button>
                    </>
                  )}
                </div>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
