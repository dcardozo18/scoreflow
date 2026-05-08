
import { supabase } from '@/lib/supabase';
import { Tournament, Team, Player, Match, TournamentFormat, TournamentStatus } from '@/app/lib/types';

/**
 * Servicio para gestionar la persistencia de datos en Supabase.
 * Mapea entre los tipos de TypeScript (camelCase) y la base de datos (snake_case).
 */

export const db = {
  // --- TOURNAMENTS ---
  async getTournaments(): Promise<Tournament[]> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*, teams(*, players(*)), matches(*)')
      .order('start_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapTournamentFromDB);
  },

  async getTournamentById(id: string): Promise<Tournament | null> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*, teams(*, players(*)), matches(*)')
      .eq('id', id)
      .single();

    if (error) return null;
    return this.mapTournamentFromDB(data);
  },

  async createTournament(tournament: Partial<Tournament>) {
    const { data, error } = await supabase
      .from('tournaments')
      .insert([this.mapTournamentToDB(tournament)])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTournament(id: string, updates: Partial<Tournament>) {
    const { error } = await supabase
      .from('tournaments')
      .update(this.mapTournamentToDB(updates))
      .eq('id', id);

    if (error) throw error;
  },

  async deleteTournament(id: string) {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // --- TEAMS ---
  async createTeam(team: Partial<Team> & { tournamentId: string }) {
    const { data, error } = await supabase
      .from('teams')
      .insert([{
        name: team.name,
        logo: team.logo,
        tournament_id: team.tournamentId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTeam(id: string, updates: Partial<Team>) {
    const { error } = await supabase
      .from('teams')
      .update({
        name: updates.name,
        logo: updates.logo
      })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteTeam(id: string) {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // --- PLAYERS ---
  async upsertPlayers(players: Partial<Player>[], teamId: string) {
    const playersToInsert = players.map(p => ({
      id: (p.id && !p.id.startsWith('p-')) ? p.id : undefined,
      team_id: teamId,
      name: p.name,
      number: p.number,
      position: p.position,
      goals: p.goals || 0,
      yellow_cards: p.yellowCards || 0,
      red_cards: p.redCards || 0
    }));

    const { error } = await supabase
      .from('players')
      .upsert(playersToInsert);

    if (error) throw error;
  },

  async deletePlayer(id: string) {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // --- MATCHES ---
  async upsertMatches(matches: Partial<Match>[], tournamentId: string) {
    const matchesToInsert = matches.map(m => ({
      id: (m.id && !m.id.startsWith('m-')) ? m.id : undefined,
      tournament_id: tournamentId,
      home_team_id: m.homeTeamId,
      away_team_id: m.awayTeamId,
      home_score: m.homeScore,
      away_score: m.awayScore,
      date: m.date?.toISOString(),
      status: m.status,
      round: m.round
    }));

    const { error } = await supabase
      .from('matches')
      .upsert(matchesToInsert);

    if (error) throw error;
  },

  async updateMatch(id: string, updates: Partial<Match>) {
    const { error } = await supabase
      .from('matches')
      .update({
        home_score: updates.homeScore,
        away_score: updates.awayScore,
        status: updates.status,
        date: updates.date?.toISOString(),
        round: updates.round
      })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteMatch(id: string) {
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // --- MAPPERS ---
  mapTournamentFromDB(dbData: any): Tournament {
    return {
      id: dbData.id,
      name: dbData.name,
      description: dbData.description || '',
      format: dbData.format as TournamentFormat,
      status: dbData.status as TournamentStatus,
      startDate: new Date(dbData.start_date),
      endDate: new Date(dbData.end_date),
      maxTeams: dbData.max_teams || 8,
      qualifyingTeamsCount: dbData.qualifying_teams_count,
      knockoutRounds: dbData.knockout_rounds,
      isHomeAndAway: dbData.is_home_and_away || false,
      pointsPerWin: dbData.points_per_win ?? 3,
      pointsPerDraw: dbData.points_per_draw ?? 1,
      pointsPerLoss: dbData.points_per_loss ?? 0,
      aiSummary: dbData.ai_summary,
      teams: (dbData.teams || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        logo: t.logo,
        players: (t.players || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          number: p.number,
          position: p.position,
          goals: p.goals || 0,
          yellowCards: p.yellow_cards || 0,
          redCards: p.red_cards || 0
        }))
      })),
      matches: (dbData.matches || []).map((m: any) => ({
        id: m.id,
        tournamentId: m.tournament_id,
        homeTeamId: m.home_team_id,
        awayTeamId: m.away_team_id,
        homeScore: m.home_score,
        awayScore: m.away_score,
        date: new Date(m.date),
        status: m.status,
        round: m.round
      }))
    };
  },

  mapTournamentToDB(t: Partial<Tournament>) {
    return {
      name: t.name,
      description: t.description,
      format: t.format,
      status: t.status,
      start_date: t.startDate?.toISOString(),
      end_date: t.endDate?.toISOString(),
      max_teams: t.maxTeams,
      qualifying_teams_count: t.qualifyingTeamsCount,
      knockout_rounds: t.knockoutRounds,
      is_home_and_away: t.isHomeAndAway,
      points_per_win: t.pointsPerWin,
      points_per_draw: t.pointsPerDraw,
      points_per_loss: t.pointsPerLoss,
      ai_summary: t.aiSummary
    };
  }
};
