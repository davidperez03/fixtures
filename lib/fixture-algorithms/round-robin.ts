// Round Robin algorithm implementation using the circle method

import type { Team, Match, FixtureGenerationResult, PhaseConfig } from "./types"

export class RoundRobinGenerator {
  private teams: Team[]
  private config: PhaseConfig
  private hasOddTeams: boolean
  private byeTeam: Team | null = null

  constructor(teams: Team[], config: PhaseConfig) {
    this.teams = [...teams]
    this.config = config
    this.hasOddTeams = teams.length % 2 !== 0

    // Add a "bye" team if odd number of teams
    if (this.hasOddTeams) {
      this.byeTeam = { id: "bye", name: "BYE" }
      this.teams.push(this.byeTeam)
    }
  }

  generate(): FixtureGenerationResult {
    const startTime = Date.now()

    try {
      const matches: Match[] = []
      const numTeams = this.teams.length
      const numRounds = numTeams - 1

      // Generate fixtures for each round of the tournament
      for (let round = 1; round <= this.config.rounds; round++) {
        const roundMatches = this.generateRound(round, numRounds)
        matches.push(...roundMatches)
      }

      const endTime = Date.now()

      return {
        matches,
        success: true,
        metadata: {
          total_matches: matches.length,
          total_rounds: numRounds * this.config.rounds,
          algorithm_used: "round_robin_circle_method",
          generation_time_ms: endTime - startTime,
          byes_generated: this.hasOddTeams ? numRounds * this.config.rounds : 0,
        },
      }
    } catch (error) {
      return {
        matches: [],
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          total_matches: 0,
          total_rounds: 0,
          algorithm_used: "round_robin_circle_method",
          generation_time_ms: Date.now() - startTime,
          byes_generated: 0,
        },
      }
    }
  }

  private generateRound(tournamentRound: number, numRounds: number): Match[] {
    const matches: Match[] = []
    const numTeams = this.teams.length

    for (let roundNumber = 1; roundNumber <= numRounds; roundNumber++) {
      const roundMatches = this.generateSingleRound(roundNumber, tournamentRound)
      matches.push(...roundMatches)
    }

    return matches
  }

  private generateSingleRound(roundNumber: number, tournamentRound: number): Match[] {
    const matches: Match[] = []
    const numTeams = this.teams.length

    // Circle method implementation
    // Fix team 0, rotate others
    const fixedTeam = this.teams[0]
    const rotatingTeams = this.teams.slice(1)

    // Calculate rotation for this round
    const rotation = (roundNumber - 1) % (numTeams - 1)
    const rotatedTeams = [...rotatingTeams.slice(rotation), ...rotatingTeams.slice(0, rotation)]

    // Create pairs
    const allTeams = [fixedTeam, ...rotatedTeams]
    const matchNumber = 1

    for (let i = 0; i < numTeams / 2; i++) {
      const team1 = allTeams[i]
      const team2 = allTeams[numTeams - 1 - i]

      // Skip if one team is the bye team
      if (team1.id === "bye" || team2.id === "bye") {
        // Create bye match for the non-bye team
        const playingTeam = team1.id === "bye" ? team2 : team1
        matches.push({
          home_team_id: playingTeam.id,
          away_team_id: null,
          round_number: this.calculateGlobalRound(roundNumber, tournamentRound),
          match_number: matchNumber + i,
          is_bye: true,
          match_type: "regular",
        })
        continue
      }

      // Determine home/away based on round and tournament round
      let homeTeam = team1
      let awayTeam = team2

      // Alternate home/away for second round in double round robin
      if (tournamentRound === 2) {
        homeTeam = team2
        awayTeam = team1
      }

      // Additional alternation based on round number to ensure fairness
      if (roundNumber % 2 === 0) {
        ;[homeTeam, awayTeam] = [awayTeam, homeTeam]
      }

      matches.push({
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        round_number: this.calculateGlobalRound(roundNumber, tournamentRound),
        match_number: matchNumber + i,
        is_bye: false,
        match_type: "regular",
      })
    }

    return matches
  }

  private calculateGlobalRound(roundNumber: number, tournamentRound: number): number {
    const numRounds = this.teams.length - 1
    return (tournamentRound - 1) * numRounds + roundNumber
  }

  // Validate that all teams play each other the correct number of times
  validateFixtures(matches: Match[]): boolean {
    const teamPairs = new Map<string, number>()

    for (const match of matches) {
      if (match.is_bye) continue

      const pair = [match.home_team_id, match.away_team_id].sort().join("-")
      teamPairs.set(pair, (teamPairs.get(pair) || 0) + 1)
    }

    // Each pair should play exactly 'rounds' times
    for (const count of teamPairs.values()) {
      if (count !== this.config.rounds) {
        return false
      }
    }

    return true
  }
}
