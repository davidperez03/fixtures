// Results calculation and standings management

import type { MatchResult, TeamStanding, ClassificationConfig, TiebreakingRule } from "./types"
import { createClient } from "@/lib/supabase/server"

export class ResultsCalculator {
  private config: ClassificationConfig
  private phaseId: string
  private groupId?: string

  constructor(phaseId: string, config: ClassificationConfig, groupId?: string) {
    this.phaseId = phaseId
    this.config = config
    this.groupId = groupId
  }

  async recordMatchResult(result: MatchResult): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()

      // Start transaction
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", result.match_id)
        .single()

      if (matchError || !match) {
        throw new Error("Match not found")
      }

      // Determine winner
      const winner = this.determineWinner(result)

      // Update match with result
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          home_score: result.home_score,
          away_score: result.away_score,
          home_score_et: result.home_score_et,
          away_score_et: result.away_score_et,
          home_score_pen: result.home_score_pen,
          away_score_pen: result.away_score_pen,
          winner_team_id: winner,
          status: result.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", result.match_id)

      if (updateError) throw updateError

      // Record match events if provided
      if (result.match_events && result.match_events.length > 0) {
        const { error: eventsError } = await supabase.from("match_events").insert(
          result.match_events.map((event) => ({
            ...event,
            match_id: result.match_id,
          })),
        )

        if (eventsError) throw eventsError
      }

      // Update standings
      await this.updateStandings(match, result)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private determineWinner(result: MatchResult): string | null {
    const { home_score, away_score, home_score_et, away_score_et, home_score_pen, away_score_pen } = result

    // Regular time
    if (home_score > away_score) return result.match_id // This should be home_team_id
    if (away_score > home_score) return result.match_id // This should be away_team_id

    // Extra time (if applicable)
    if (home_score_et !== undefined && away_score_et !== undefined) {
      const totalHome = home_score + home_score_et
      const totalAway = away_score + away_score_et

      if (totalHome > totalAway) return result.match_id // home_team_id
      if (totalAway > totalHome) return result.match_id // away_team_id
    }

    // Penalties (if applicable)
    if (home_score_pen !== undefined && away_score_pen !== undefined) {
      if (home_score_pen > away_score_pen) return result.match_id // home_team_id
      if (away_score_pen > home_score_pen) return result.match_id // away_team_id
    }

    return null // Draw
  }

  private async updateStandings(match: any, result: MatchResult): Promise<void> {
    const supabase = await createClient()

    // Get current standings
    let query = supabase.from("standings").select("*").eq("phase_id", this.phaseId)

    if (this.groupId) {
      query = query.eq("group_id", this.groupId)
    }

    const { data: currentStandings, error } = await query

    if (error) throw error

    // Calculate new standings
    const updatedStandings = await this.calculateStandings(currentStandings || [], match, result)

    // Update database
    for (const standing of updatedStandings) {
      const { error: updateError } = await supabase.from("standings").upsert({
        phase_id: this.phaseId,
        group_id: this.groupId,
        team_id: standing.team_id,
        matches_played: standing.matches_played,
        wins: standing.wins,
        draws: standing.draws,
        losses: standing.losses,
        goals_for: standing.goals_for,
        goals_against: standing.goals_against,
        goal_difference: standing.goal_difference,
        points: standing.points,
        position: standing.position,
        updated_at: new Date().toISOString(),
      })

      if (updateError) throw updateError
    }
  }

  private async calculateStandings(currentStandings: any[], match: any, result: MatchResult): Promise<TeamStanding[]> {
    // Get all matches for this phase/group to recalculate from scratch
    const supabase = await createClient()

    let matchQuery = supabase
      .from("matches")
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name),
        away_team:teams!matches_away_team_id_fkey(id, name)
      `)
      .eq("phase_id", this.phaseId)
      .eq("status", "completed")

    if (this.groupId) {
      matchQuery = matchQuery.eq("group_id", this.groupId)
    }

    const { data: allMatches, error } = await matchQuery

    if (error) throw error

    // Get all teams in this phase/group
    const teams = new Set<string>()
    allMatches?.forEach((match) => {
      if (match.home_team_id) teams.add(match.home_team_id)
      if (match.away_team_id) teams.add(match.away_team_id)
    })

    // Initialize standings
    const standings: TeamStanding[] = Array.from(teams).map((teamId) => {
      const teamMatch = allMatches?.find((m) => m.home_team_id === teamId || m.away_team_id === teamId)
      const teamName = teamMatch?.home_team_id === teamId ? teamMatch?.home_team?.name : teamMatch?.away_team?.name

      return {
        team_id: teamId,
        team_name: teamName || "Unknown",
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
        position: 0,
        form: [],
      }
    })

    // Calculate stats from all matches
    allMatches?.forEach((match) => {
      if (!match.home_team_id || !match.away_team_id) return

      const homeStanding = standings.find((s) => s.team_id === match.home_team_id)
      const awayStanding = standings.find((s) => s.team_id === match.away_team_id)

      if (!homeStanding || !awayStanding) return

      // Update matches played
      homeStanding.matches_played++
      awayStanding.matches_played++

      // Update goals
      homeStanding.goals_for += match.home_score || 0
      homeStanding.goals_against += match.away_score || 0
      awayStanding.goals_for += match.away_score || 0
      awayStanding.goals_against += match.home_score || 0

      // Determine result and update points/record
      const homeScore = (match.home_score || 0) + (match.home_score_et || 0)
      const awayScore = (match.away_score || 0) + (match.away_score_et || 0)

      if (homeScore > awayScore) {
        // Home win
        homeStanding.wins++
        homeStanding.points += this.config.points_for_win
        awayStanding.losses++
        awayStanding.points += this.config.points_for_loss
        homeStanding.form.push("W")
        awayStanding.form.push("L")
      } else if (awayScore > homeScore) {
        // Away win
        awayStanding.wins++
        awayStanding.points += this.config.points_for_win
        homeStanding.losses++
        homeStanding.points += this.config.points_for_loss
        awayStanding.form.push("W")
        homeStanding.form.push("L")
      } else {
        // Draw (or decided by penalties)
        if (match.winner_team_id) {
          // Decided by penalties - winner gets win points, loser gets draw points
          if (match.winner_team_id === match.home_team_id) {
            homeStanding.wins++
            homeStanding.points += this.config.penalty_shootout_winner_points || this.config.points_for_win
            awayStanding.losses++
            awayStanding.points += this.config.points_for_draw
            homeStanding.form.push("W")
            awayStanding.form.push("L")
          } else {
            awayStanding.wins++
            awayStanding.points += this.config.penalty_shootout_winner_points || this.config.points_for_win
            homeStanding.losses++
            homeStanding.points += this.config.points_for_draw
            awayStanding.form.push("W")
            homeStanding.form.push("L")
          }
        } else {
          // Regular draw
          homeStanding.draws++
          awayStanding.draws++
          homeStanding.points += this.config.points_for_draw
          awayStanding.points += this.config.points_for_draw
          homeStanding.form.push("D")
          awayStanding.form.push("D")
        }
      }

      // Keep only last 5 results
      if (homeStanding.form.length > 5) homeStanding.form = homeStanding.form.slice(-5)
      if (awayStanding.form.length > 5) awayStanding.form = awayStanding.form.slice(-5)
    })

    // Calculate goal difference
    standings.forEach((standing) => {
      standing.goal_difference = standing.goals_for - standing.goals_against
    })

    // Sort by tiebreaking rules and assign positions
    const sortedStandings = this.sortByTiebreakingRules(standings)
    sortedStandings.forEach((standing, index) => {
      standing.position = index + 1
    })

    return sortedStandings
  }

  private sortByTiebreakingRules(standings: TeamStanding[]): TeamStanding[] {
    return standings.sort((a, b) => {
      for (const rule of this.config.tiebreaking_rules) {
        const comparison = this.compareByRule(a, b, rule)
        if (comparison !== 0) return comparison
      }
      return 0
    })
  }

  private compareByRule(a: TeamStanding, b: TeamStanding, rule: TiebreakingRule): number {
    let valueA: number
    let valueB: number

    switch (rule.type) {
      case "points":
        valueA = a.points
        valueB = b.points
        break
      case "goal_difference":
        valueA = a.goal_difference
        valueB = b.goal_difference
        break
      case "goals_for":
        valueA = a.goals_for
        valueB = b.goals_for
        break
      case "goals_against":
        valueA = a.goals_against
        valueB = b.goals_against
        break
      case "head_to_head":
        valueA = a.head_to_head_points || 0
        valueB = b.head_to_head_points || 0
        break
      case "fair_play":
        valueA = a.fair_play_points || 0
        valueB = b.fair_play_points || 0
        break
      default:
        return 0
    }

    if (rule.order === "desc") {
      return valueB - valueA
    } else {
      return valueA - valueB
    }
  }

  // Get current standings for a phase/group
  async getStandings(): Promise<TeamStanding[]> {
    const supabase = await createClient()

    let query = supabase
      .from("standings")
      .select(`
        *,
        team:teams(name, short_name)
      `)
      .eq("phase_id", this.phaseId)
      .order("position", { ascending: true })

    if (this.groupId) {
      query = query.eq("group_id", this.groupId)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map((standing) => ({
      team_id: standing.team_id,
      team_name: standing.team?.name || "Unknown",
      matches_played: standing.matches_played,
      wins: standing.wins,
      draws: standing.draws,
      losses: standing.losses,
      goals_for: standing.goals_for,
      goals_against: standing.goals_against,
      goal_difference: standing.goal_difference,
      points: standing.points,
      position: standing.position,
      form: [], // Would need to calculate from recent matches
    }))
  }

  // Calculate head-to-head record between two teams
  async calculateHeadToHead(
    teamA: string,
    teamB: string,
  ): Promise<{
    teamA_points: number
    teamB_points: number
    teamA_goals: number
    teamB_goals: number
  }> {
    const supabase = await createClient()

    const { data: matches, error } = await supabase
      .from("matches")
      .select("*")
      .eq("phase_id", this.phaseId)
      .eq("status", "completed")
      .or(
        `and(home_team_id.eq.${teamA},away_team_id.eq.${teamB}),and(home_team_id.eq.${teamB},away_team_id.eq.${teamA})`,
      )

    if (error) throw error

    let teamA_points = 0
    let teamB_points = 0
    let teamA_goals = 0
    let teamB_goals = 0

    matches?.forEach((match) => {
      const homeScore = (match.home_score || 0) + (match.home_score_et || 0)
      const awayScore = (match.away_score || 0) + (match.away_score_et || 0)

      if (match.home_team_id === teamA) {
        teamA_goals += homeScore
        teamB_goals += awayScore

        if (homeScore > awayScore) {
          teamA_points += this.config.points_for_win
          teamB_points += this.config.points_for_loss
        } else if (awayScore > homeScore) {
          teamB_points += this.config.points_for_win
          teamA_points += this.config.points_for_loss
        } else {
          teamA_points += this.config.points_for_draw
          teamB_points += this.config.points_for_draw
        }
      } else {
        teamB_goals += homeScore
        teamA_goals += awayScore

        if (homeScore > awayScore) {
          teamB_points += this.config.points_for_win
          teamA_points += this.config.points_for_loss
        } else if (awayScore > homeScore) {
          teamA_points += this.config.points_for_win
          teamB_points += this.config.points_for_loss
        } else {
          teamA_points += this.config.points_for_draw
          teamB_points += this.config.points_for_draw
        }
      }
    })

    return { teamA_points, teamB_points, teamA_goals, teamB_goals }
  }
}
