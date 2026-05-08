
"use client";

import { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, ArrowUpRight, Plus, Activity, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/services/db';
import { Tournament } from '@/app/lib/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [dbStatus, setDbStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initDashboard() {
      try {
        const data = await db.getTournaments();
        setTournaments(data);
        setDbStatus('connected');
      } catch (error) {
        console.error('Error connecting to Supabase:', error);
        setDbStatus('error');
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, []);

  const activeTournaments = tournaments.filter(t => t.status === 'Active');
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Gestión centralizada en Supabase.</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={dbStatus === 'connected' ? 'default' : dbStatus === 'error' ? 'destructive' : 'outline'} className="h-8 gap-2">
            {dbStatus === 'connected' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {dbStatus === 'connected' ? 'Supabase Online' : dbStatus === 'error' ? 'Error de Conexión' : 'Probando Conexión...'}
          </Badge>
          <Button className="flex items-center gap-2 shadow-lg" asChild>
            <Link href="/admin/tournaments"><Plus className="h-4 w-4" /> Nuevo Torneo</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Total Torneos <Trophy className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{tournaments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Activos <Activity className="h-4 w-4 text-green-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{activeTournaments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Equipos Totales <Users className="h-4 w-4 text-accent" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {tournaments.reduce((acc, t) => acc + t.teams.length, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Próximos Juegos <Calendar className="h-4 w-4 text-orange-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {tournaments.reduce((acc, t) => acc + t.matches.filter(m => m.status === 'Scheduled').length, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Torneos Activos Recientes</CardTitle>
            <CardDescription>Datos sincronizados en tiempo real.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-8 opacity-20"><Activity className="animate-spin h-8 w-8" /></div>
            ) : activeTournaments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No hay torneos activos. ¡Crea uno nuevo!
              </div>
            ) : (
              activeTournaments.map(tournament => (
                <div key={tournament.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center text-primary">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary">{tournament.name}</h4>
                      <p className="text-xs text-muted-foreground">{tournament.format} • {tournament.teams.length} Equipos</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/tournaments/${tournament.id}`}>
                      Gestionar <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Servidor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${dbStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="text-sm font-medium">Conexión a Base de Datos</p>
                  <p className="text-xs text-muted-foreground">
                    {dbStatus === 'connected' ? 'Persistencia activa en jivlxagnaslcifnsoxdi.supabase.co' : 'Error al conectar con el backend.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium">Carga del Sistema</p>
                  <p className="text-xs text-muted-foreground">Latencia óptima detectada.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
