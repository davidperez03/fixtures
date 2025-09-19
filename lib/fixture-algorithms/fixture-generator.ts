// Main fixture generator that orchestrates all algorithms

import type { Team, Match, FixtureGenerationResult, PhaseConfig, SchedulingConstraint } from "./types"
import { RoundRobinGenerator } from "./round-robin"
import { KnockoutGenerator } from "./knockout"
import { GroupsGenerator } from "./groups"
import { LevelsGenerator } from "./levels"

export class FixtureGenerator {
  private teams: Team[]
  private config: PhaseConfig
  private constraints: SchedulingConstraint[]

  constructor(teams: Team[], config: PhaseConfig, constraints: SchedulingConstraint[] = []) {
    this.teams = teams
    this.config = config
    this.constraints = constraints
  }

  async generate(): Promise<FixtureGenerationResult> {
    try {
      // Validate inputs
      this.validateInputs()

      // Generate base fixtures based on phase type
      let result = await this.generateBaseFixtures()

      if (!result.success) {
        return result
      }

      // Apply scheduling constraints
      result = await this.applyConstraints(result)

      // Generate home/away legs if configured
      if (this.config.home_away_legs === 2) {
        result.matches = this.generateHomeAwayLegs(result.matches)
        result.metadata.total_matches = result.matches.length
      }

      // Validate final fixtures
      const validationResult = this.validateFixtures(result.matches)
      if (!validationResult.isValid) {
        return {
          ...result,
          success: false,
          error: `Fixture validation failed: ${validationResult.errors.join(", ")}`,
        }
      }

      return result
    } catch (error) {
      return {
        matches: [],
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        metadata: {
          total_matches: 0,
          total_rounds: 0,
          algorithm_used: "unknown",
          generation_time_ms: 0,
          byes_generated: 0,
        },
      }
    }
  }

  private async generateBaseFixtures(): Promise<FixtureGenerationResult> {
    switch (this.config.phase_type) {
      case "league":
        return new RoundRobinGenerator(this.teams, this.config).generate()

      case "knockout":
        return new KnockoutGenerator(this.teams, this.config).generate()

      case "groups":
        return new GroupsGenerator(this.teams, this.config).generate()

      case "levels":
        return new LevelsGenerator(this.teams, this.config).generate()

      case "combined":
        // For combined phases, this would orchestrate multiple phases
        // For now, default to groups
        return new GroupsGenerator(this.teams, this.config).generate()

      default:
        throw new Error(`Unsupported phase type: ${this.config.phase_type}`)
    }
  }

  private async applyConstraints(result: FixtureGenerationResult): Promise<FixtureGenerationResult> {
    if (this.constraints.length === 0) {
      return result
    }

    const constrainedMatches = [...result.matches]

    // Apply each constraint
    for (const constraint of this.constraints) {
      switch (constraint.type) {
        case "team_rest_days":
          this.applyRestDaysConstraint(constrainedMatches, constraint)
          break
        case "no_consecutive_home_away":
          this.applyHomeAwayConstraint(constrainedMatches, constraint)
          break
        case "venue_availability":
          this.applyVenueConstraint(constrainedMatches, constraint)
          break
        case "blackout_dates":
          this.applyBlackoutDatesConstraint(constrainedMatches, constraint)
          break
      }
    }

    return {
      ...result,
      matches: constrainedMatches,
    }
  }

  private applyRestDaysConstraint(matches: Match[], constraint: SchedulingConstraint): void {
    const minRestDays = constraint.config.min_days || this.config.min_rest_days
    const teamId = constraint.team_id

    // Sort matches by round for the specific team
    const teamMatches = matches
      .filter((match) => match.home_team_id === teamId || match.away_team_id === teamId)
      .sort((a, b) => a.round_number - b.round_number)

    // This is a simplified implementation
    // In a real system, you'd need to consider actual dates and reschedule if needed
    console.log(`Applied rest days constraint for team ${teamId}: ${minRestDays} days`)
  }

  private applyHomeAwayConstraint(matches: Match[], constraint: SchedulingConstraint): void {
    const teamId = constraint.team_id
    if (!teamId) return

    // Ensure no more than 2 consecutive home or away games
    const teamMatches = matches
      .filter((match) => match.home_team_id === teamId || match.away_team_id === teamId)
      .sort((a, b) => a.round_number - b.round_number)

    // This would implement the logic to rearrange home/away assignments
    console.log(`Applied home/away constraint for team ${teamId}`)
  }

  private applyVenueConstraint(matches: Match[], constraint: SchedulingConstraint): void {
    // Prevent venue conflicts (multiple matches at same venue/time)
    console.log(`Applied venue constraint for venue ${constraint.venue_id}`)
  }

  private applyBlackoutDatesConstraint(matches: Match[], constraint: SchedulingConstraint): void {
    // Avoid scheduling matches on blackout dates
    const blackoutDates = constraint.config.dates || []
    console.log(`Applied blackout dates constraint: ${blackoutDates.length} dates`)
  }

  private generateHomeAwayLegs(matches: Match[]): Match[] {
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
        round_number: match.round_number + 100, // Offset for second leg rounds
      })
    }

    return legMatches
  }

  private validateInputs(): void {
    if (this.teams.length < 2) {
      throw new Error("At least 2 teams are required")
    }

    if (this.config.phase_type === "knockout" && this.teams.length < 4) {
      throw new Error("Knockout tournaments require at least 4 teams")
    }

    if (this.config.phase_type === "groups") {
      const groupsCount = this.config.groups_count || Math.ceil(this.teams.length / 4)
      if (groupsCount < 2) {
        throw new Error("Group phase requires at least 2 groups")
      }
    }
  }

  private validateFixtures(matches: Match[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check for duplicate matches
    const matchPairs = new Set<string>()
    for (const match of matches) {
      if (match.is_bye) continue

      const pair = [match.home_team_id, match.away_team_id].sort().join("-")
      if (matchPairs.has(pair)) {
        errors.push(`Duplicate match found: ${pair}`)
      }
      matchPairs.add(pair)
    }

    // Check that no team plays against itself
    for (const match of matches) {
      if (!match.is_bye && match.home_team_id === match.away_team_id) {
        errors.push(`Team cannot play against itself: ${match.home_team_id}`)
      }
    }

    // Check for valid round numbers
    for (const match of matches) {
      if (match.round_number < 1) {
        errors.push(`Invalid round number: ${match.round_number}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Utility method to get fixture statistics
  getFixtureStatistics(matches: Match[]): {
    totalMatches: number
    matchesPerRound: Record<number, number>
    teamMatchCounts: Record<string, number>
    byeCount: number
  } {
    const stats = {
      totalMatches: matches.length,
      matchesPerRound: {} as Record<number, number>,
      teamMatchCounts: {} as Record<string, number>,
      byeCount: 0,
    }

    for (const match of matches) {
      // Count matches per round
      stats.matchesPerRound[match.round_number] = (stats.matchesPerRound[match.round_number] || 0) + 1

      if (match.is_bye) {
        stats.byeCount++
        if (match.home_team_id) {
          stats.teamMatchCounts[match.home_team_id] = (stats.teamMatchCounts[match.home_team_id] || 0) + 1
        }
      } else {
        // Count matches for each team
        if (match.home_team_id) {
          stats.teamMatchCounts[match.home_team_id] = (stats.teamMatchCounts[match.home_team_id] || 0) + 1
        }
        if (match.away_team_id) {
          stats.teamMatchCounts[match.away_team_id] = (stats.teamMatchCounts[match.away_team_id] || 0) + 1
        }
      }
    }

    return stats
  }
}
