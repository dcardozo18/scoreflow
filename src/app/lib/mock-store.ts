
import { Tournament, StandingsEntry, Match } from './types';

export const mockTournaments: Tournament[] = [
  {
    id: 't1',
    name: 'Summer Champions League',
    description: 'The premier local football league for regional champions.',
    format: 'League',
    status: 'Active',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-30'),
    teams: [
      { id: 'team1', name: 'Eagles FC', players: [], logo: 'https://picsum.photos/seed/team1/100/100' },
      { id: 'team2', name: 'Lions United', players: [], logo: 'https://picsum.photos/seed/team2/100/100' },
      { id: 'team3', name: 'Strikers City', players: [], logo: 'https://picsum.photos/seed/team3/100/100' },
      { id: 'team4', name: 'Defense Towers', players: [], logo: 'https://picsum.photos/seed/team4/100/100' },
    ],
    matches: [
      { id: 'm1', tournamentId: 't1', homeTeamId: 'team1', awayTeamId: 'team2', homeScore: 2, awayScore: 1, date: new Date('2024-06-15'), status: 'Completed' },
      { id: 'm2', tournamentId: 't1', homeTeamId: 'team3', awayTeamId: 'team4', homeScore: 0, awayScore: 0, date: new Date('2024-06-16'), status: 'Completed' },
      { id: 'm3', tournamentId: 't1', homeTeamId: 'team1', awayTeamId: 'team3', date: new Date('2024-07-20'), status: 'Scheduled' },
    ]
  },
  {
    id: 't2',
    name: 'Winter Cup 2023',
    description: 'A knockout tournament celebrating the winter season.',
    format: 'Knockout',
    status: 'Completed',
    startDate: new Date('2023-11-01'),
    endDate: new Date('2023-12-20'),
    aiSummary: 'The Winter Cup 2023 concluded with a thrilling victory for Eagles FC. They demonstrated tactical superiority throughout the knockout stages, finally defeating Lions United 3-2 in a dramatic final match that saw a last-minute goal.',
    teams: [
      { id: 'team1', name: 'Eagles FC', players: [] },
      { id: 'team2', name: 'Lions United', players: [] },
    ],
    matches: [
      { id: 'm-final', tournamentId: 't2', homeTeamId: 'team1', awayTeamId: 'team2', homeScore: 3, awayScore: 2, date: new Date('2023-12-20'), status: 'Completed' },
    ]
  }
];

export function calculateStandings(tournament: Tournament): StandingsEntry[] {
  if (tournament.format !== 'League') return [];

  const standingsMap = new Map<string, StandingsEntry>();

  tournament.teams.forEach(team => {
    standingsMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    });
  });

  tournament.matches.filter(m => m.status === 'Completed').forEach(match => {
    const home = standingsMap.get(match.homeTeamId)!;
    const away = standingsMap.get(match.awayTeamId)!;

    home.played++;
    away.played++;
    home.goalsFor += match.homeScore || 0;
    home.goalsAgainst += match.awayScore || 0;
    away.goalsFor += match.awayScore || 0;
    away.goalsAgainst += match.homeScore || 0;

    if (match.homeScore! > match.awayScore!) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (match.homeScore! < match.awayScore!) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  });

  return Array.from(standingsMap.values()).sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
}
