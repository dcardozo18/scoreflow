
import { Tournament, StandingsEntry, Match, Player } from './types';

const createMockPlayers = (teamName: string): Player[] => [
  { id: `p-${teamName}-1`, name: `Striker ${teamName}`, number: 9, position: 'FW', goals: Math.floor(Math.random() * 10), yellowCards: Math.floor(Math.random() * 3), redCards: Math.floor(Math.random() * 1) },
  { id: `p-${teamName}-2`, name: `Midfielder ${teamName}`, number: 10, position: 'MF', goals: Math.floor(Math.random() * 5), yellowCards: Math.floor(Math.random() * 4), redCards: 0 },
  { id: `p-${teamName}-3`, name: `Defender ${teamName}`, number: 4, position: 'DF', goals: Math.floor(Math.random() * 2), yellowCards: Math.floor(Math.random() * 6), redCards: Math.floor(Math.random() * 2) },
];

export const mockTournaments: Tournament[] = [
  {
    id: 't1',
    name: 'Summer Champions League',
    description: 'La liga premier local para campeones regionales de verano.',
    format: 'League',
    status: 'Active',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-30'),
    maxTeams: 12,
    qualifyingTeamsCount: 4,
    isHomeAndAway: true,
    teams: [
      { id: 'team1', name: 'Eagles FC', logo: 'https://picsum.photos/seed/team1/100/100', players: createMockPlayers('Eagles') },
      { id: 'team2', name: 'Lions United', logo: 'https://picsum.photos/seed/team2/100/100', players: createMockPlayers('Lions') },
      { id: 'team3', name: 'Strikers City', logo: 'https://picsum.photos/seed/team3/100/100', players: createMockPlayers('Strikers') },
      { id: 'team4', name: 'Defense Towers', logo: 'https://picsum.photos/seed/team4/100/100', players: createMockPlayers('Defense') },
    ],
    matches: [
      { id: 'm1', tournamentId: 't1', homeTeamId: 'team1', awayTeamId: 'team2', homeScore: 2, awayScore: 1, date: new Date('2024-06-15'), status: 'Completed' },
      { id: 'm2', tournamentId: 't1', homeTeamId: 'team3', awayTeamId: 'team4', homeScore: 0, awayScore: 0, date: new Date('2024-06-16'), status: 'Completed' },
      { id: 'm3', tournamentId: 't1', homeTeamId: 'team1', awayTeamId: 'team3', date: new Date('2024-07-20'), status: 'Scheduled' },
      { id: 'm4', tournamentId: 't1', homeTeamId: 'team2', awayTeamId: 'team4', date: new Date('2024-07-21'), status: 'Scheduled' },
    ]
  },
  {
    id: 't2',
    name: 'Winter Cup 2023',
    description: 'Un torneo de eliminación directa celebrando la temporada de invierno.',
    format: 'Knockout',
    status: 'Completed',
    startDate: new Date('2023-11-01'),
    endDate: new Date('2023-12-20'),
    maxTeams: 8,
    isHomeAndAway: false,
    aiSummary: 'La Winter Cup 2023 concluyó con una emocionante victoria de Eagles FC. Demostraron superioridad táctica durante las fases eliminatorias, derrotando finalmente a Lions United 3-2 en una final dramática con un gol de último minuto.',
    teams: [
      { id: 'team1', name: 'Eagles FC', players: createMockPlayers('Eagles'), logo: 'https://picsum.photos/seed/team1/100/100' },
      { id: 'team2', name: 'Lions United', players: createMockPlayers('Lions'), logo: 'https://picsum.photos/seed/team2/100/100' },
    ],
    matches: [
      { id: 'm-final', tournamentId: 't2', homeTeamId: 'team1', awayTeamId: 'team2', homeScore: 3, awayScore: 2, date: new Date('2023-12-20'), status: 'Completed' },
    ]
  }
];

export function calculateStandings(tournament: Tournament): StandingsEntry[] {
  if (tournament.format !== 'League' && tournament.format !== 'LeagueKnockout') return [];

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

    if (!home || !away) return;

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
