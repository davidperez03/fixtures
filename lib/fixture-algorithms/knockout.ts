// Knockout/Elimination tournament algorithm

import type { Team, Match, FixtureGenerationResult, PhaseConfig } from "./types"

export class KnockoutGenerator {
  private teams: Team[]
  private config: PhaseConfig
  private totalTeams: number
  private rounds: number

  constructor(teams: Team[], config: PhaseConfig) {
    this.teams = [...teams].sort((a, b) => (a.seed || 0) - (b.seed || 0))
    this.config = config
    this.totalTeams = teams.length
    this.rounds = Math.ceil(Math.log2(this.totalTeams))
  }

  generate(): FixtureGenerationResult {
    const startTime = Date.now()

    try {
      const matches: Match[] = []
      let byesGenerated = 0

      // Calculate if we need byes (when teams is not a power of 2)
      const nextPowerOf2 = Math.pow(2, this.rounds)
      const byesNeeded = nextPowerOf2 - this.totalTeams

      // Generate first round with byes if needed
      const firstRoundMatches = this.generateFirstRound(byesNeeded)
      matches.push(...firstRoundMatches)
      byesGenerated = byesNeeded

      // Generate subsequent rounds (placeholders for winners)
      const subsequentRounds = this.generateSubsequentRounds()
      matches.push(...subsequentRounds)

      // Generate consolation matches if configured
      if (this.config.has_consolation) {
        const consolationMatches = this.generateConsolationMatches()
        matches.push(...consolationMatches)
      }

      const endTime = Date.now()

      return {
        matches,
        success: true,
        metadata: {
          total_matches: matches.length,
          total_rounds: this.rounds + (this.config.has_consolation ? 1 : 0),
          algorithm_used: "knockout_seeded",
          generation_time_ms: endTime - startTime,
          byes_generated: byesGenerated,
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
          algorithm_used: "knockout_seeded",
          generation_time_ms: Date.now() - startTime,
          byes_generated: 0,
        },
      }
    }
  }

  private generateFirstRound(byesNeeded: number): Match[] {
    const matches: Match[] = []
    const teamsInFirstRound = this.totalTeams - byesNeeded
    let matchNumber = 1

    // Create bracket pairings using seeding
    const bracket = this.createSeededBracket()

    // Generate matches for teams that don't get byes
    for (let i = 0; i < teamsInFirstRound; i += 2) {
      const homeTeam = bracket[i]
      const awayTeam = bracket[i + 1]

      if (homeTeam && awayTeam) {
        matches.push({
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          round_number: 1,
          match_number: matchNumber++,
          is_bye: false,
          match_type: "regular",
        })
      }
    }

    // Generate bye matches for seeded teams
    for (let i = teamsInFirstRound; i < bracket.length; i++) {
      const team = bracket[i]
      if (team) {
        matches.push({
          home_team_id: team.id,
          away_team_id: null,
          round_number: 1,
          match_number: matchNumber++,
          is_bye: true,
          match_type: "regular",
        })
      }
    }

    return matches
  }

  private generateSubsequentRounds(): Match[] {
    const matches: Match[] = []
    let matchesInRound = Math.ceil(this.totalTeams / 2)

    for (let round = 2; round <= this.rounds; round++) {
      matchesInRound = Math.ceil(matchesInRound / 2)

      for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
        const matchType = round === this.rounds ? "final" : "playoff"

        matches.push({
          home_team_id: null, // Will be filled by winners from previous round
          away_team_id: null, // Will be filled by winners from previous round
          round_number: round,
          match_number: matchNum,
          is_bye: false,
          match_type: matchType, // Declare the variable before using it
        })
      }
    }

    return matches
  }

  private generateConsolationMatches(): Match[] {
    const matches: Match[] = []

    // Third place playoff (consolation final)
    matches.push({
      home_team_id: null, // Loser of semifinal 1
      away_team_id: null, // Loser of semifinal 2
      round_number: this.rounds,
      match_number: 999, // Special number for consolation
      is_bye: false,
      match_type: "consolation",
    })

    return matches
  }

  private createSeededBracket(): Team[] {
    // Create seeded bracket to avoid early matchups between top seeds
    const bracket: Team[] = []
    const sortedTeams = [...this.teams]

    if (sortedTeams.length <= 2) {
      return sortedTeams
    }

    // Simple seeding: alternate high and low seeds
    const highSeeds = sortedTeams.slice(0, Math.ceil(sortedTeams.length / 2))
    const lowSeeds = sortedTeams.slice(Math.ceil(sortedTeams.length / 2)).reverse()

    for (let i = 0; i < Math.max(highSeeds.length, lowSeeds.length); i++) {
      if (highSeeds[i]) bracket.push(highSeeds[i])
      if (lowSeeds[i]) bracket.push(lowSeeds[i])
    }

    return bracket
  }

  // Generate home/away legs for knockout matches
  generateLegs(matches: Match[]): Match[] {
    if (this.config.home_away_legs === 1) {
      return matches
    }

    const legMatches: Match[] = []

    for (const match of matches) {
      if (match.is_bye) {
        legMatches.push(match)
        continue
      }

      // First leg
      legMatches.push({
        ...match,
        match_number: match.match_number * 2 - 1,
      })

      // Second leg (reverse home/away)
      legMatches.push({
        ...match,
        home_team_id: match.away_team_id,
        away_team_id: match.home_team_id,
        match_number: match.match_number * 2,
      })
    }

    return legMatches
  }
}
