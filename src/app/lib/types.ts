
export type TournamentFormat = 'League' | 'Knockout' | 'Groups' | 'LeagueKnockout';
export type TournamentStatus = 'Upcoming' | 'Active' | 'Completed';

export interface Player {
  id: string;
  name: string;
  number?: number;
  position?: string;
  goals: number;
  yellowCards: number;
  redCards: number;
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  players: Player[];
}

export interface Match {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  date: Date;
  status: 'Scheduled' | 'Completed';
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  format: TournamentFormat;
  status: TournamentStatus;
  startDate: Date;
  endDate: Date;
  teams: Team[];
  matches: Match[];
  aiSummary?: string;
  // Parametros avanzados
  maxTeams: number;
  qualifyingTeamsCount?: number;
  isHomeAndAway: boolean;
}

export interface StandingsEntry {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}
