
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
import { TournamentFormat, SchedulingPreferences, Match } from '@/app/lib/types';
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
      allowedDays: [5, 6, 0],
      startTime: '08:00',
      endTime: '20:00',
      matchDurationMinutes: 90
    }
  );

  if (!tournament) return <div>Torneo no encontrado.</div>;

  const groupedMatches = tournament.matches.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const roundNumbers = Object.keys(groupedMatches).map(Number).sort((a, b) => a - b);

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
        description: `Se han generado ${newMatches.length} partidos organizados por fechas.`,
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

      <Tabs defaultValue="matches" className="space-y-6">
        <TabsList className="bg-white p-1 border">
          <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Configuración</TabsTrigger>
          <TabsTrigger value="matches" className="gap-2"><List className="h-4 w-4" /> Resultados</TabsTrigger>
          <TabsTrigger value="teams" className="gap-2"><Users className="h-4 w-4" /> Equipos</TabsTrigger>
          <TabsTrigger value="scheduler" className="gap-2"><CalendarIcon className="h-4 w-4" /> Programación Auto</TabsTrigger>
          <TabsTrigger value="ai" className="gap-2"><Sparkles className="h-4 w-4" /> IA</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Parámetros</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tipo de Torneo</Label>
                  <Select value={tournament.format} onValueChange={handleFormatChange}>
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
                  <Switch checked={tournament.isHomeAndAway} onCheckedChange={(v) => setTournament(p => p ? {...p, isHomeAndAway: v} : p)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-10">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Cronograma por Fechas</h3>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Añadir Partido</Button>
          </div>
          {roundNumbers.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-xl">
               <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
               <p className="text-muted-foreground">Usa el Generador Automático para crear las fechas.</p>
            </div>
          ) : (
            roundNumbers.map(roundNum => (
              <div key={roundNum} className="space-y-4">
                <h4 className="font-bold text-primary flex items-center gap-2">
                  <Badge variant="outline">Fecha {roundNum}</Badge>
                </h4>
                <div className="grid gap-3">
                  {groupedMatches[roundNum].map(match => (
                    <Card key={match.id}>
                      <CardContent className="p-3 flex items-center gap-4">
                        <div className="flex-1 text-right font-medium">{tournament.teams.find(t => t.id === match.homeTeamId)?.name}</div>
                        <div className="flex items-center gap-2">
                          <Input className="w-10 text-center font-bold h-8" defaultValue={match.homeScore} />
                          <span className="text-muted-foreground">-</span>
                          <Input className="w-10 text-center font-bold h-8" defaultValue={match.awayScore} />
                        </div>
                        <div className="flex-1 text-left font-medium">{tournament.teams.find(t => t.id === match.awayTeamId)?.name}</div>
                        <div className="text-[10px] text-muted-foreground w-32 text-right">
                          {match.date.toLocaleDateString()} {match.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8"><Trash2 className="h-3 w-3" /></Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="scheduler" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-accent" /> Generador de Calendario</CardTitle>
              <CardDescription>Los partidos se agruparán automáticamente en fechas según el algoritmo Round Robin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label>Días de Juego</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {DAYS.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2 border p-2 rounded-md">
                        <Checkbox checked={schedPrefs.allowedDays.includes(day.id)} onCheckedChange={(c) => setSchedPrefs(p => ({...p, allowedDays: c ? [...p.allowedDays, day.id] : p.allowedDays.filter(d => d !== day.id)}))} />
                        <span className="text-xs">{day.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Desde</Label>
                    <Input type="time" value={schedPrefs.startTime} onChange={(e) => setSchedPrefs(p => ({ ...p, startTime: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hasta</Label>
                    <Input type="time" value={schedPrefs.endTime} onChange={(e) => setSchedPrefs(p => ({ ...p, endTime: e.target.value }))} />
                  </div>
                </div>
              </div>
              <Button onClick={handleAutoSchedule} className="w-full" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                Generar Cronograma Completo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Crónica Deportiva IA</CardTitle></CardHeader>
            <CardContent>
              <div className="p-6 border-2 border-dashed rounded-lg text-center">
                {tournament.aiSummary ? (
                   <p className="italic text-primary">"{tournament.aiSummary}"</p>
                ) : (
                   <Button onClick={handleGenerateSummary} disabled={aiLoading}>
                     {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                     Generar ahora
                   </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
