// Levels/Divisions algorithm (ascensos y descensos)

import type { Team, Match, FixtureGenerationResult, PhaseConfig } from "./types"
import { RoundRobinGenerator } from "./round-robin"

interface Level {
  id: string
  name: string
  level_number: number
  teams: Team[]
}

export class LevelsGenerator {
  private teams: Team[]
  private config: PhaseConfig
  private levels: Level[] = []

  constructor(teams: Team[], config: PhaseConfig) {
    this.teams = [...teams]
    this.config = config
    this.createLevels()
  }

  generate(): FixtureGenerationResult {
    const startTime = Date.now()

    try {
      const allMatches: Match[] = []
      let totalByes = 0

      // Generate fixtures for each level
      for (const level of this.levels) {
        const levelGenerator = new RoundRobinGenerator(level.teams, this.config)
        const levelResult = levelGenerator.generate()

        if (!levelResult.success) {
          throw new Error(`Failed to generate fixtures for ${level.name}: ${levelResult.error}`)
        }

        // Add level information to matches
        const levelMatches = levelResult.matches.map((match) => ({
          ...match,
          // Store level info in a custom field or use group_id
          group_id: level.id,
        }))

        allMatches.push(...levelMatches)
        totalByes += levelResult.metadata.byes_generated
      }

      const endTime = Date.now()

      return {
        matches: allMatches,
        success: true,
        metadata: {
          total_matches: allMatches.length,
          total_rounds: this.calculateTotalRounds(),
          algorithm_used: "levels_round_robin",
          generation_time_ms: endTime - startTime,
          byes_generated: totalByes,
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
          algorithm_used: "levels_round_robin",
          generation_time_ms: Date.now() - startTime,
          byes_generated: 0,
        },
      }
    }
  }

  private createLevels(): void {
    // Determine number of levels based on team count
    const totalTeams = this.teams.length
    const teamsPerLevel = 8 // Configurable
    const numLevels = Math.ceil(totalTeams / teamsPerLevel)

    // Sort teams by current level or seed
    const sortedTeams = this.sortTeamsByLevel([...this.teams])

    for (let levelNum = 1; levelNum <= numLevels; levelNum++) {
      const startIndex = (levelNum - 1) * teamsPerLevel
      const endIndex = Math.min(startIndex + teamsPerLevel, sortedTeams.length)
      const levelTeams = sortedTeams.slice(startIndex, endIndex)

      if (levelTeams.length > 0) {
        this.levels.push({
          id: `level_${levelNum}`,
          name: this.getLevelName(levelNum, numLevels),
          level_number: levelNum,
          teams: levelTeams,
        })
      }
    }
  }

  private sortTeamsByLevel(teams: Team[]): Team[] {
    // Sort by current level (if available) or by seed
    return teams.sort((a, b) => {
      // Assuming we have level info in seed field for now
      const levelA = a.seed || 999
      const levelB = b.seed || 999
      return levelA - levelB
    })
  }

  private getLevelName(levelNumber: number, totalLevels: number): string {
    if (totalLevels === 1) return "División Única"

    switch (levelNumber) {
      case 1:
        return "Primera División"
      case 2:
        return "Segunda División"
      case 3:
        return "Tercera División"
      default:
        return `División ${levelNumber}`
    }
  }

  private calculateTotalRounds(): number {
    if (this.levels.length === 0) return 0

    // Calculate rounds based on largest level
    const maxTeamsInLevel = Math.max(...this.levels.map((level) => level.teams.length))
    return (maxTeamsInLevel - 1) * this.config.rounds
  }

  getLevels(): Level[] {
    return this.levels
  }

  // Calculate promotions and relegations after season ends
  calculatePromotionsRelegations(): {
    promotions: { team: Team; from_level: number; to_level: number }[]
    relegations: { team: Team; from_level: number; to_level: number }[]
  } {
    const promotions: { team: Team; from_level: number; to_level: number }[] = []
    const relegations: { team: Team; from_level: number; to_level: number }[] = []

    // This would be implemented after standings are calculated
    // For now, return empty arrays as placeholder

    return { promotions, relegations }
  }

  // Generate next season with promoted/relegated teams
  generateNextSeason(
    promotions: { team: Team; from_level: number; to_level: number }[],
    relegations: { team: Team; from_level: number; to_level: number }[],
  ): LevelsGenerator {
    // Create new team distribution based on promotions/relegations
    const newTeams = [...this.teams] // This would be updated with new positions

    return new LevelsGenerator(newTeams, this.config)
  }
}
