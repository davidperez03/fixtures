// Types for results and classification system

export interface MatchResult {
  match_id: string
  home_score: number
  away_score: number
  home_score_et?: number // Extra time
  away_score_et?: number
  home_score_pen?: number // Penalties
  away_score_pen?: number
  winner_team_id?: string
  status: "completed" | "live" | "suspended"
  match_events?: MatchEvent[]
}

export interface MatchEvent {
  id?: string
  match_id: string
  team_id: string
  player_name?: string
  event_type: "goal" | "yellow_card" | "red_card" | "substitution" | "other"
  minute: number
  description?: string
}

export interface TeamStanding {
  team_id: string
  team_name: string
  matches_played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
  position: number
  form: string[] // Last 5 results: W, D, L
  head_to_head_points?: number
  head_to_head_goal_diff?: number
  fair_play_points?: number
}

export interface TiebreakingRule {
  type: "points" | "goal_difference" | "goals_for" | "goals_against" | "head_to_head" | "fair_play" | "random"
  order: "desc" | "asc"
  priority: number
}

export interface ClassificationConfig {
  points_for_win: number
  points_for_draw: number
  points_for_loss: number
  tiebreaking_rules: TiebreakingRule[]
  count_extra_time_as_draw?: boolean
  penalty_shootout_winner_points?: number
}

export interface StandingsUpdate {
  phase_id: string
  group_id?: string
  standings: TeamStanding[]
  last_updated: Date
}
