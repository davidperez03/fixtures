// Group phase algorithm (multiple round-robin groups)

import type { Team, Match, FixtureGenerationResult, PhaseConfig, Group } from "./types"
import { RoundRobinGenerator } from "./round-robin"

export class GroupsGenerator {
  private teams: Team[]
  private config: PhaseConfig
  private groups: Group[] = []

  constructor(teams: Team[], config: PhaseConfig) {
    this.teams = [...teams]
    this.config = config
    this.createGroups()
  }

  generate(): FixtureGenerationResult {
    const startTime = Date.now()

    try {
      const allMatches: Match[] = []
      let totalByes = 0

      // Generate fixtures for each group
      for (const group of this.groups) {
        const groupGenerator = new RoundRobinGenerator(group.teams, this.config)
        const groupResult = groupGenerator.generate()

        if (!groupResult.success) {
          throw new Error(`Failed to generate fixtures for ${group.name}: ${groupResult.error}`)
        }

        // Add group_id to all matches
        const groupMatches = groupResult.matches.map((match) => ({
          ...match,
          group_id: group.id,
        }))

        allMatches.push(...groupMatches)
        totalByes += groupResult.metadata.byes_generated
      }

      const endTime = Date.now()

      return {
        matches: allMatches,
        success: true,
        metadata: {
          total_matches: allMatches.length,
          total_rounds: this.calculateTotalRounds(),
          algorithm_used: "groups_round_robin",
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
          algorithm_used: "groups_round_robin",
          generation_time_ms: Date.now() - startTime,
          byes_generated: 0,
        },
      }
    }
  }

  private createGroups(): void {
    const groupsCount = this.config.groups_count || Math.ceil(this.teams.length / 4)
    const teamsPerGroup = Math.ceil(this.teams.length / groupsCount)

    // Shuffle teams for random distribution (or use seeding if available)
    const shuffledTeams = this.shuffleTeams([...this.teams])

    for (let i = 0; i < groupsCount; i++) {
      const groupName = String.fromCharCode(65 + i) // A, B, C, etc.
      const startIndex = i * teamsPerGroup
      const endIndex = Math.min(startIndex + teamsPerGroup, shuffledTeams.length)
      const groupTeams = shuffledTeams.slice(startIndex, endIndex)

      if (groupTeams.length > 0) {
        this.groups.push({
          id: `group_${groupName.toLowerCase()}`,
          name: `Grupo ${groupName}`,
          teams: groupTeams,
        })
      }
    }
  }

  private shuffleTeams(teams: Team[]): Team[] {
    // If teams have seeds, distribute them evenly across groups
    if (teams.some((team) => team.seed)) {
      return this.distributeSeededTeams(teams)
    }

    // Simple shuffle for unseeded teams
    const shuffled = [...teams]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private distributeSeededTeams(teams: Team[]): Team[] {
    const seeded = teams.filter((team) => team.seed).sort((a, b) => (a.seed || 0) - (b.seed || 0))
    const unseeded = teams.filter((team) => !team.seed)

    const groupsCount = this.config.groups_count || Math.ceil(teams.length / 4)
    const distributed: Team[] = []

    // Distribute seeded teams first (one per group in order)
    for (let i = 0; i < seeded.length; i++) {
      const groupIndex = i % groupsCount
      // Insert at the position for this group
      const insertIndex = Math.floor(i / groupsCount) * groupsCount + groupIndex
      distributed[insertIndex] = seeded[i]
    }

    // Fill remaining positions with unseeded teams
    let unseededIndex = 0
    for (let i = 0; i < teams.length; i++) {
      if (!distributed[i] && unseededIndex < unseeded.length) {
        distributed[i] = unseeded[unseededIndex++]
      }
    }

    return distributed.filter(Boolean) // Remove any undefined entries
  }

  private calculateTotalRounds(): number {
    if (this.groups.length === 0) return 0

    // Assume all groups have similar number of teams
    const avgTeamsPerGroup = Math.ceil(this.teams.length / this.groups.length)
    const roundsPerGroup = (avgTeamsPerGroup - 1) * this.config.rounds

    return roundsPerGroup
  }

  getGroups(): Group[] {
    return this.groups
  }

  // Get qualified teams from each group (for multi-phase tournaments)
  getQualifiedTeams(): Team[] {
    // This would be implemented after results are recorded
    // For now, return empty array as placeholder
    return []
  }
}
