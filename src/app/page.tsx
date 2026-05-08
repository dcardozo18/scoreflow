
import Link from 'next/link';
import { Trophy, Calendar, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import { mockTournaments } from '@/app/lib/mock-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Home() {
  const activeTournaments = mockTournaments.filter(t => t.status === 'Active' || t.status === 'Upcoming');
  const completedTournaments = mockTournaments.filter(t => t.status === 'Completed');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-headline text-2xl font-bold text-primary">
            <Trophy className="h-8 w-8" />
            <span>ScoreFlow</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin/login">
              <Button variant="ghost" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6">Elevate Your Tournament Experience</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            Professional football tournament management made simple. Live scores, detailed standings, and AI-powered highlights.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <a href="#active-tournaments">Browse Tournaments</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 flex-1">
        <div id="active-tournaments" className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-headline font-bold text-primary">Current & Upcoming</h2>
            <Link href="#" className="text-accent flex items-center gap-1 hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeTournaments.map(tournament => (
              <Card key={tournament.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-32 bg-secondary/50 flex items-center justify-center">
                   <Trophy className="h-12 w-12 text-primary opacity-20" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={tournament.status === 'Active' ? 'default' : 'outline'}>
                      {tournament.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {tournament.startDate.toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{tournament.name}</CardTitle>
                  <CardDescription>{tournament.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {tournament.teams.length} Teams</span>
                    <span className="flex items-center gap-1 font-medium text-accent">{tournament.format}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/tournament/${tournament.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {completedTournaments.length > 0 && (
          <div>
            <h2 className="text-3xl font-headline font-bold text-primary mb-8">Tournament Archive</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {completedTournaments.map(tournament => (
                <Card key={tournament.id} className="bg-white">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">Completed</Badge>
                    <CardTitle>{tournament.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground italic line-clamp-3">
                      "{tournament.aiSummary || 'Tournament highlights pending AI generation...'}"
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/tournament/${tournament.id}`}>View Final Results</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
             <Trophy className="h-6 w-6 text-primary" />
             <span className="font-headline font-bold text-xl text-primary">ScoreFlow</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2024 ScoreFlow Tournament Management. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
