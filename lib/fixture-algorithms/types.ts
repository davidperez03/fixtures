// Types for fixture generation algorithms

export interface Team {
  id: string
  name: string
  short_name?: string
  seed?: number
}

export interface Match {
  id?: string
  home_team_id: string | null
  away_team_id: string | null
  round_number: number
  match_number: number
  match_date?: Date
  venue_id?: string
  is_bye: boolean
  match_type: "regular" | "playoff" | "final" | "consolation"
  group_id?: string
}

export interface PhaseConfig {
  phase_type: "knockout" | "league" | "groups" | "levels" | "combined"
  home_away_legs: 1 | 2
  rounds: number // For league: 1 = single RR, 2 = double RR
  has_consolation?: boolean // For knockout
  groups_count?: number // For groups
  teams_per_group?: number // For groups
  qualified_per_group?: number // For groups
  promoted_per_level?: number // For levels
  relegated_per_level?: number // For levels
  min_rest_days: number
  points_for_win: number
  points_for_draw: number
  points_for_loss: number
}

export interface FixtureGenerationResult {
  matches: Match[]
  success: boolean
  error?: string
  metadata: {
    total_matches: number
    total_rounds: number
    algorithm_used: string
    generation_time_ms: number
    byes_generated: number
  }
}

export interface Group {
  id: string
  name: string
  teams: Team[]
}

export interface SchedulingConstraint {
  type: "venue_availability" | "team_rest_days" | "no_consecutive_home_away" | "blackout_dates"
  team_id?: string
  venue_id?: string
  config: Record<string, any>
  priority: number
  is_hard_constraint: boolean
}
