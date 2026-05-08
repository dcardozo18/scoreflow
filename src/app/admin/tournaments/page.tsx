
"use client";

import { useState, useEffect } from 'react';
import { Trophy, MoreVertical, Plus, Trash, Search, ExternalLink, Settings2, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { mockTournaments } from '@/app/lib/mock-store';
import Link from 'next/link';
import { TournamentFormat } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function ManageTournaments() {
  const [isMounted, setIsMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTournamentFormat, setNewTournamentFormat] = useState<TournamentFormat>('League');
  const [tournamentToDelete, setTournamentToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filtered = mockTournaments.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteTournament = () => {
    if (!tournamentToDelete) return;
    // Simulate delete
    toast({
      title: "Torneo Eliminado",
      description: "La competición ha sido removida del sistema.",
      variant: "destructive"
    });
    setTournamentToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Torneos</h1>
          <p className="text-muted-foreground">Administra y configura tus competiciones de fútbol.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-md">
              <Plus className="h-4 w-4 mr-2" /> Nuevo Torneo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] overflow-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Torneo</DialogTitle>
              <DialogDescription>
                Configura los parámetros base de tu nueva competición.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" placeholder="Ej: Copa de Verano" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format">Tipo de Torneo</Label>
                  <Select value={newTournamentFormat} onValueChange={(v: TournamentFormat) => setNewTournamentFormat(v)}>
                    <SelectTrigger id="format">
                      <SelectValue placeholder="Formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="League">Solo Liga</SelectItem>
                      <SelectItem value="Knockout">Eliminatoria</SelectItem>
                      <SelectItem value="Groups">Por Grupos</SelectItem>
                      <SelectItem value="LeagueKnockout">Liga + Eliminatoria (Mixto)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teams">Cantidad de Equipos</Label>
                  <Input id="teams" type="number" defaultValue={8} />
                </div>
                {newTournamentFormat !== 'LeagueKnockout' && (
                  <div className="space-y-2">
                    <Label htmlFor="qualifying">Equipos que clasifican</Label>
                    <Input id="qualifying" type="number" placeholder="Ej: 4" />
                  </div>
                )}
              </div>

              {newTournamentFormat === 'LeagueKnockout' && (
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-xl bg-accent/5 border-accent/20 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label className="text-accent font-bold">Equipos que clasifican</Label>
                    <Input type="number" placeholder="Ej: 8" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-accent font-bold">Rondas Eliminatoria</Label>
                    <Input type="number" placeholder="Ej: 3 (8vos, 4tos...)" />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/20">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Torneo de Ida y Vuelta</Label>
                  <p className="text-xs text-muted-foreground">Se generarán automáticamente dos partidos por cruce.</p>
                </div>
                <Switch />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Descripción Breve</Label>
                <Input id="desc" placeholder="Resumen del torneo..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" onClick={() => setIsCreateOpen(false)}>Crear Torneo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Listado de Competiciones</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre..." 
                className="pl-10" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Torneo</TableHead>
                <TableHead>Formato / Reglas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Equipos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id} className="hover:bg-secondary/10">
                  <TableCell className="font-bold text-primary">
                    <div className="flex flex-col">
                       <div className="flex items-center gap-2">
                         <Trophy className="h-4 w-4 text-primary/40" />
                         {t.name}
                       </div>
                       <span className="text-[10px] text-muted-foreground font-normal ml-6">
                         {isMounted ? t.startDate.toLocaleDateString() : '...'}
                       </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{t.format}</span>
                      <div className="flex gap-2">
                        {t.isHomeAndAway && <Badge variant="outline" className="text-[9px] h-4">Ida/Vuelta</Badge>}
                        {t.qualifyingTeamsCount && <Badge variant="outline" className="text-[9px] h-4">Top {t.qualifyingTeamsCount} Clasifica</Badge>}
                        {t.knockoutRounds && <Badge variant="outline" className="text-[9px] h-4">{t.knockoutRounds} Rondas Finales</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'Active' ? 'default' : t.status === 'Completed' ? 'secondary' : 'outline'}>
                      {t.status === 'Active' ? 'En curso' : t.status === 'Completed' ? 'Finalizado' : 'Próximo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-bold">{t.teams.length}</span>
                      <span className="text-muted-foreground text-xs">/ {t.maxTeams}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild title="Ver sitio público">
                        <Link href={`/tournament/${t.id}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/tournaments/${t.id}`} className="flex items-center">
                              <Settings2 className="h-4 w-4 mr-2" /> Configurar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Info className="h-4 w-4 mr-2" /> Ver Estadísticas
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setTournamentToDelete(t.id)}
                          >
                            <Trash className="h-4 w-4 mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!tournamentToDelete} onOpenChange={(open) => !open && setTournamentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> ¿Eliminar este torneo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente toda la información, equipos, partidos y estadísticas asociadas a este torneo. Esta operación no se puede revertir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTournament} className="bg-destructive hover:bg-destructive/90">
              Confirmar Eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
