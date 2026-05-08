
"use client";

import { useState, useEffect } from 'react';
import { Trophy, MoreVertical, Plus, Trash, Search, ExternalLink, Settings2, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { db } from '@/lib/services/db';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from 'next/link';
import { TournamentFormat, Tournament } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function ManageTournaments() {
  const [isMounted, setIsMounted] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTournament, setNewTournament] = useState<Partial<Tournament>>({
    name: '',
    format: 'League',
    maxTeams: 8,
    isHomeAndAway: false,
    pointsPerWin: 3,
    pointsPerDraw: 1,
    pointsPerLoss: 0,
    startDate: new Date(),
    endDate: new Date(),
    status: 'Upcoming'
  });
  const [tournamentToDelete, setTournamentToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    setIsMounted(true);
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await db.getTournaments();
      setTournaments(data);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los torneos de Supabase.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = tournaments.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    try {
      await db.createTournament(newTournament);
      toast({ title: "Torneo Creado", description: "Persistido en Supabase." });
      setIsCreateOpen(false);
      loadTournaments();
    } catch (error) {
      toast({ title: "Error", description: "Falló la creación.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!tournamentToDelete) return;
    try {
      await db.deleteTournament(tournamentToDelete);
      toast({ title: "Torneo Eliminado", variant: "destructive" });
      setTournamentToDelete(null);
      loadTournaments();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar de Supabase.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Gestión de Torneos</h1>
          <p className="text-muted-foreground">Conectado a Supabase: {tournaments.length} competiciones.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-md"><Plus className="h-4 w-4 mr-2" /> Nuevo Torneo</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Torneo Real</DialogTitle>
              <DialogDescription>Configura los parámetros para la base de datos.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={newTournament.name} onChange={e => setNewTournament({...newTournament, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Formato</Label>
                  <Select value={newTournament.format} onValueChange={(v: TournamentFormat) => setNewTournament({...newTournament, format: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="League">Liga</SelectItem>
                      <SelectItem value="Knockout">Eliminatoria</SelectItem>
                      <SelectItem value="LeagueKnockout">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate}>Confirmar en DB</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Listado en Tiempo Real</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Torneo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Equipos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-bold text-primary">
                       {t.name}
                       <div className="text-[10px] text-muted-foreground">{isMounted ? t.startDate.toLocaleDateString() : '...'}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
                    <TableCell>{t.teams.length} / {t.maxTeams}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-2">
                         <Button variant="ghost" size="icon" asChild>
                           <Link href={`/admin/tournaments/${t.id}`}><Settings2 className="h-4 w-4" /></Link>
                         </Button>
                         <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setTournamentToDelete(t.id)}>
                           <Trash className="h-4 w-4" />
                         </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!tournamentToDelete} onOpenChange={(open) => !open && setTournamentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> ¿Borrar de Supabase?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción eliminará permanentemente todos los equipos, jugadores y partidos asociados a este torneo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">Confirmar Borrado</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
