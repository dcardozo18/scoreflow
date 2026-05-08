
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
  Trash2
} from 'lucide-react';
import { mockTournaments } from '@/app/lib/mock-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateTournamentSummary } from '@/ai/flows/generate-tournament-summary-flow';

export default function TournamentManagement() {
  const params = useParams();
  const { toast } = useToast();
  const tournamentId = params.id as string;
  const initialTournament = mockTournaments.find(t => t.id === tournamentId);
  
  const [tournament, setTournament] = useState(initialTournament);
  const [aiLoading, setAiLoading] = useState(false);

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
        winnerTeam: tournament.teams[0].name
      });
      
      setTournament({ ...tournament, aiSummary: result.summary });
      toast({ title: "Summary Generated", description: "AI has successfully generated tournament highlights." });
    } catch (err) {
      toast({ title: "Generation Failed", description: "Could not generate AI summary at this time.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">{tournament.name}</h1>
          <p className="text-muted-foreground">Management Console</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline">Preview Public</Button>
           <Button><Save className="h-4 w-4 mr-2" /> Save Changes</Button>
        </div>
      </div>

      <Tabs defaultValue="matches" className="space-y-6">
        <TabsList>
          <TabsTrigger value="matches" className="gap-2"><List className="h-4 w-4" /> Match Results</TabsTrigger>
          <TabsTrigger value="teams" className="gap-2"><Users className="h-4 w-4" /> Team Roster</TabsTrigger>
          <TabsTrigger value="ai" className="gap-2"><Sparkles className="h-4 w-4" /> AI Highlights</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Config</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Scheduled & Past Matches</h3>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Match</Button>
          </div>
          <div className="grid gap-4">
            {tournament.matches.map(match => (
              <Card key={match.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 text-right font-medium">{tournament.teams.find(t => t.id === match.homeTeamId)?.name}</div>
                  <div className="flex items-center gap-2">
                    <Input className="w-12 text-center font-bold" defaultValue={match.homeScore} />
                    <span className="text-muted-foreground">-</span>
                    <Input className="w-12 text-center font-bold" defaultValue={match.awayScore} />
                  </div>
                  <div className="flex-1 text-left font-medium">{tournament.teams.find(t => t.id === match.awayTeamId)?.name}</div>
                  <div className="text-xs text-muted-foreground w-32">{match.date.toLocaleDateString()}</div>
                  <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Participating Teams</h3>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Register Team</Button>
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
                      <p className="text-xs text-muted-foreground">{team.players.length} Players</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Edit Squad</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
           <Card className="border-accent/40 bg-accent/5">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Sparkles className="h-5 w-5 text-accent" />
                 AI Tournament Summarization
               </CardTitle>
               <CardDescription>
                 Use GenAI to create a compelling summary of the tournament based on results and standings.
               </CardDescription>
             </CardHeader>
             <CardContent>
                <div className="min-h-[200px] border-2 border-dashed border-accent/20 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                  {tournament.aiSummary ? (
                    <div className="text-left w-full space-y-4">
                       <p className="italic text-primary leading-relaxed">"{tournament.aiSummary}"</p>
                       <Button onClick={handleGenerateSummary} variant="outline" size="sm" disabled={aiLoading}>
                         {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                         Regenerate
                       </Button>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="h-12 w-12 text-accent opacity-20 mb-4" />
                      <p className="text-muted-foreground mb-6">No summary generated yet. Complete the tournament first for best results.</p>
                      <Button onClick={handleGenerateSummary} disabled={aiLoading}>
                        {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        Generate Highlights
                      </Button>
                    </>
                  )}
                </div>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Core Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tournament Name</Label>
                  <Input defaultValue={tournament.name} />
                </div>
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Input defaultValue={tournament.format} readOnly />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input defaultValue={tournament.description} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" defaultValue={tournament.startDate.toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input defaultValue={tournament.status} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t pt-6">
               <Button variant="ghost" className="mr-2">Reset</Button>
               <Button>Apply Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
