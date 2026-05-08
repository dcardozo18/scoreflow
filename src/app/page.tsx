
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Calendar, Users, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { db } from '@/lib/services/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tournament } from '@/app/lib/types';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    db.getTournaments().then(data => {
      setTournaments(data);
      setLoading(false);
    });
  }, []);

  const activeTournaments = tournaments.filter(t => t.status === 'Active' || t.status === 'Upcoming');
  const completedTournaments = tournaments.filter(t => t.status === 'Completed');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-headline text-2xl font-bold text-primary">
            <Trophy className="h-8 w-8" />
            <span>ScoreFlow</span>
          </Link>
          <Link href="/admin/login">
            <Button variant="ghost" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Admin
            </Button>
          </Link>
        </div>
      </header>

      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6">Torneos de Fútbol Profesionales</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            Gestión en tiempo real con Supabase. Resultados en vivo, tablas dinámicas y análisis inteligente.
          </p>
          <Button size="lg" variant="secondary" asChild><a href="#active-tournaments">Ver Torneos</a></Button>
        </div>
      </section>

      <main className="container mx-auto px-4 py-16 flex-1">
        {loading ? (
          <div className="text-center py-20"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" /></div>
        ) : (
          <>
            <div id="active-tournaments" className="mb-20">
              <h2 className="text-3xl font-headline font-bold text-primary mb-8">Competiciones en Curso</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeTournaments.map(tournament => (
                  <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={tournament.status === 'Active' ? 'default' : 'outline'}>{tournament.status}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {isMounted ? tournament.startDate.toLocaleDateString() : '...'}
                        </span>
                      </div>
                      <CardTitle className="text-xl">{tournament.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{tournament.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1 font-bold text-primary"><Users className="h-4 w-4" /> {tournament.teams.length} Equipos</span>
                        <span className="flex items-center gap-1 text-accent">{tournament.format}</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" asChild><Link href={`/tournament/${tournament.id}`}>Ver Detalles</Link></Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>

            {completedTournaments.length > 0 && (
              <div>
                <h2 className="text-3xl font-headline font-bold text-primary mb-8">Histórico de Torneos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {completedTournaments.map(tournament => (
                    <Card key={tournament.id} className="bg-white border-l-4 border-l-accent">
                      <CardHeader>
                        <Badge variant="secondary" className="w-fit mb-2">Finalizado</Badge>
                        <CardTitle>{tournament.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground italic line-clamp-3">"{tournament.aiSummary || 'Resultados finales disponibles.'}"</p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="ghost" size="sm" asChild><Link href={`/tournament/${tournament.id}`}>Resultados Finales <ArrowRight className="h-4 w-4 ml-2" /></Link></Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">© 2024 ScoreFlow powered by Supabase. Gestión deportiva de alto nivel.</p>
        </div>
      </footer>
    </div>
  );
}
