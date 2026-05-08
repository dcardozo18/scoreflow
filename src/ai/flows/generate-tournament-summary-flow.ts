'use server';
/**
 * @fileOverview A Genkit flow for generating concise textual summaries of completed tournaments.
 *
 * - generateTournamentSummary - A function that generates a summary of a football tournament.
 * - GenerateTournamentSummaryInput - The input type for the generateTournamentSummary function.
 * - GenerateTournamentSummaryOutput - The return type for the generateTournamentSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateTournamentSummaryInputSchema = z.object({
  tournamentName: z.string().describe('The name of the tournament.'),
  tournamentDescription: z.string().optional().describe('A brief description of the tournament.'),
  teams: z.array(z.object({
    name: z.string().describe('The name of the team.'),
    rank: z.number().optional().describe('The final ranking of the team in the tournament (e.g., 1 for winner, 2 for runner-up).'),
  })).describe('A list of participating teams with their final rankings if available.'),
  matchHighlights: z.array(z.object({
    matchDescription: z.string().describe('A description of a key match or dramatic moment, including participating teams and scores. Example: "The final match saw a thrilling 3-2 victory for Eagles over Lions."'),
  })).describe('A list of key match highlights or dramatic moments from the tournament.'),
  winnerTeam: z.string().optional().describe('The name of the winning team of the tournament.'),
  runnerUpTeam: z.string().optional().describe('The name of the runner-up team of the tournament.'),
});
export type GenerateTournamentSummaryInput = z.infer<typeof GenerateTournamentSummaryInputSchema>;

const GenerateTournamentSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise textual summary of the completed tournament, highlighting key results, standout teams, and dramatic moments.'),
});
export type GenerateTournamentSummaryOutput = z.infer<typeof GenerateTournamentSummaryOutputSchema>;

export async function generateTournamentSummary(input: GenerateTournamentSummaryInput): Promise<GenerateTournamentSummaryOutput> {
  return generateTournamentSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTournamentSummaryPrompt',
  input: { schema: GenerateTournamentSummaryInputSchema },
  output: { schema: GenerateTournamentSummaryOutputSchema },
  prompt: `You are a sports journalist tasked with writing a concise and engaging summary of a completed football tournament.
Focus on key outcomes, standout teams, and dramatic moments. The summary should be easy to read and capture the excitement of the event.

Tournament Name: {{{tournamentName}}}
{{#if tournamentDescription}}
Tournament Description: {{{tournamentDescription}}}
{{/if}}

{{#if winnerTeam}}
Winner: {{{winnerTeam}}}
{{/if}}
{{#if runnerUpTeam}}
Runner-up: {{{runnerUpTeam}}}
{{/if}}

{{#if teams.length}}
Final Standings (if available, ordered by rank):
{{#each teams}}
- Team: {{{name}}}{{#if rank}}, Rank: {{{rank}}}{{/if}}
{{/each}}
{{/if}}

{{#if matchHighlights.length}}
Key Match Highlights:
{{#each matchHighlights}}
- {{{matchDescription}}}
{{/each}}
{{/if}}

Based on the information provided, generate a concise summary of the tournament:
`,
});

const generateTournamentSummaryFlow = ai.defineFlow(
  {
    name: 'generateTournamentSummaryFlow',
    inputSchema: GenerateTournamentSummaryInputSchema,
    outputSchema: GenerateTournamentSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
