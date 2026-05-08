
import { Team, Match, SchedulingPreferences } from './types';
import { addMinutes, setHours, setMinutes, addDays, isBefore, parse, format, getDay } from 'date-fns';

export function generateLeagueMatches(
  tournamentId: string,
  teams: Team[],
  startDate: Date,
  isHomeAndAway: boolean,
  prefs: SchedulingPreferences
): Match[] {
  if (teams.length < 2) return [];

  const matches: { home: string; away: string }[] = [];
  const teamIds = teams.map(t => t.id);
  
  // Round Robin Algorithm (Circle Method)
  const tempTeams = [...teamIds];
  if (tempTeams.length % 2 !== 0) tempTeams.push('BYE');
  
  const rounds = tempTeams.length - 1;
  const half = tempTeams.length / 2;

  for (let i = 0; i < rounds; i++) {
    for (let j = 0; j < half; j++) {
      const home = tempTeams[j];
      const away = tempTeams[tempTeams.length - 1 - j];
      if (home !== 'BYE' && away !== 'BYE') {
        matches.push({ home, away });
      }
    }
    tempTeams.splice(1, 0, tempTeams.pop()!);
  }

  if (isHomeAndAway) {
    const returnMatches = matches.map(m => ({ home: m.away, away: m.home }));
    matches.push(...returnMatches);
  }

  // Assign dates based on preferences
  const scheduledMatches: Match[] = [];
  let currentDate = new Date(startDate);
  
  const [startH, startM] = prefs.startTime.split(':').map(Number);
  const [endH, endM] = prefs.endTime.split(':').map(Number);

  let currentMatchTime = setMinutes(setHours(currentDate, startH), startM);

  matches.forEach((m, index) => {
    // Find next valid day
    while (!prefs.allowedDays.includes(getDay(currentMatchTime))) {
      currentMatchTime = addDays(currentMatchTime, 1);
      currentMatchTime = setMinutes(setHours(currentMatchTime, startH), startM);
    }

    // Check if within time range
    const limitTime = setMinutes(setHours(currentMatchTime, endH), endM);
    if (isBefore(limitTime, addMinutes(currentMatchTime, prefs.matchDurationMinutes))) {
      // Move to next day
      currentMatchTime = addDays(currentMatchTime, 1);
      while (!prefs.allowedDays.includes(getDay(currentMatchTime))) {
        currentMatchTime = addDays(currentMatchTime, 1);
      }
      currentMatchTime = setMinutes(setHours(currentMatchTime, startH), startM);
    }

    scheduledMatches.push({
      id: `m-auto-${index}`,
      tournamentId,
      homeTeamId: m.home,
      awayTeamId: m.away,
      date: new Date(currentMatchTime),
      status: 'Scheduled'
    });

    // Increment time for next match
    currentMatchTime = addMinutes(currentMatchTime, prefs.matchDurationMinutes + 15); // 15 min buffer
  });

  return scheduledMatches;
}
