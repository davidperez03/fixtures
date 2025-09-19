// Advanced validation system for tournaments and fixtures
// Implements all the complex validation rules specified in the requirements

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  code: string
  message: string
  field?: string
  severity: "error" | "warning"
}

export interface ValidationWarning {
  code: string
  message: string
  suggestion?: string
}

export interface TournamentConstraints {
  minTeams: number
  maxTeams: number
  minRestDays: number
  maxMatchesPerDay: number
  allowedVenues: string[]
  blackoutDates: Date[]
  preferredTimeSlots: TimeSlot[]
}

export interface TimeSlot {
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string // HH:MM format
  endTime: string
}

export class TournamentValidator {
  private constraints: TournamentConstraints

  constructor(constraints: TournamentConstraints) {
    this.constraints = constraints
  }

  // Validate tournament structure
  validateTournament(tournament: any, phases: any[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Validate tournament dates
    if (new Date(tournament.start_date) >= new Date(tournament.end_date)) {
      errors.push({
        code: "INVALID_DATE_RANGE",
        message: "La fecha de inicio debe ser anterior a la fecha de fin",
        field: "dates",
        severity: "error",
      })
    }

    // Validate phases
    for (const phase of phases) {
      const phaseValidation = this.validatePhase(phase)
      errors.push(...phaseValidation.errors)
      warnings.push(...phaseValidation.warnings)
    }

    // Check for phase order conflicts
    const phaseOrders = phases.map((p) => p.phase_order)
    const duplicateOrders = phaseOrders.filter((order, index) => phaseOrders.indexOf(order) !== index)
    if (duplicateOrders.length > 0) {
      errors.push({
        code: "DUPLICATE_PHASE_ORDER",
        message: "Existen fases con el mismo orden de ejecución",
        severity: "error",
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  // Validate individual phase
  validatePhase(phase: any): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Validate team count for phase type
    const teamCount = phase.participants?.length || 0

    if (phase.phase_type === "knockout") {
      // Knockout phases work better with power of 2
      if (!this.isPowerOfTwo(teamCount) && teamCount > 2) {
        warnings.push({
          code: "NON_POWER_OF_TWO_KNOCKOUT",
          message: `Fase eliminatoria con ${teamCount} equipos requerirá byes automáticos`,
          suggestion: "Considere usar un número que sea potencia de 2 para mejor balance",
        })
      }
    }

    if (phase.phase_type === "league" && teamCount < 3) {
      errors.push({
        code: "INSUFFICIENT_TEAMS_LEAGUE",
        message: "Una fase de liga requiere al menos 3 equipos",
        field: "participants",
        severity: "error",
      })
    }

    // Validate configuration
    if (phase.config) {
      const config = typeof phase.config === "string" ? JSON.parse(phase.config) : phase.config

      if (phase.phase_type === "league") {
        if (!config.points_for_win || config.points_for_win <= 0) {
          errors.push({
            code: "INVALID_POINTS_CONFIG",
            message: "Los puntos por victoria deben ser mayor a 0",
            severity: "error",
          })
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  // Validate fixture scheduling
  validateFixtures(matches: any[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check for scheduling conflicts
    const venueSchedule = new Map<string, Date[]>()
    const teamSchedule = new Map<string, Date[]>()

    for (const match of matches) {
      const matchDate = new Date(match.scheduled_date)

      // Check venue conflicts
      if (match.venue_id) {
        if (!venueSchedule.has(match.venue_id)) {
          venueSchedule.set(match.venue_id, [])
        }

        const venueDates = venueSchedule.get(match.venue_id)!
        const conflictingDate = venueDates.find(
          (date) => Math.abs(date.getTime() - matchDate.getTime()) < 2 * 60 * 60 * 1000, // 2 hours
        )

        if (conflictingDate) {
          errors.push({
            code: "VENUE_CONFLICT",
            message: `Conflicto de venue en ${match.venue_id} el ${matchDate.toLocaleDateString()}`,
            severity: "error",
          })
        }

        venueDates.push(matchDate)
      }

      // Check team rest days
      for (const teamId of [match.home_team_id, match.away_team_id]) {
        if (!teamSchedule.has(teamId)) {
          teamSchedule.set(teamId, [])
        }

        const teamDates = teamSchedule.get(teamId)!
        const lastMatch = teamDates[teamDates.length - 1]

        if (lastMatch) {
          const daysDiff = (matchDate.getTime() - lastMatch.getTime()) / (1000 * 60 * 60 * 24)
          if (daysDiff < this.constraints.minRestDays) {
            warnings.push({
              code: "INSUFFICIENT_REST",
              message: `Equipo ${teamId} tiene menos de ${this.constraints.minRestDays} días de descanso`,
              suggestion: "Considere reprogramar el partido",
            })
          }
        }

        teamDates.push(matchDate)
      }

      // Check blackout dates
      if (this.constraints.blackoutDates.some((blackout) => blackout.toDateString() === matchDate.toDateString())) {
        errors.push({
          code: "BLACKOUT_DATE",
          message: `Partido programado en fecha no permitida: ${matchDate.toLocaleDateString()}`,
          severity: "error",
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  private isPowerOfTwo(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0
  }
}

// Export validation utilities
export const createDefaultConstraints = (): TournamentConstraints => ({
  minTeams: 2,
  maxTeams: 64,
  minRestDays: 3,
  maxMatchesPerDay: 8,
  allowedVenues: [],
  blackoutDates: [],
  preferredTimeSlots: [
    { dayOfWeek: 6, startTime: "15:00", endTime: "17:00" }, // Saturday afternoon
    { dayOfWeek: 0, startTime: "15:00", endTime: "17:00" }, // Sunday afternoon
  ],
})
