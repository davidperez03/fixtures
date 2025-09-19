"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, RefreshCw } from "lucide-react"
import type { TeamStanding } from "@/lib/results/types"

interface StandingsTableProps {
  phaseId: string
  groupId?: string
  title?: string
  showPositionChanges?: boolean
  highlightPositions?: {
    promotion?: number[]
    relegation?: number[]
    qualification?: number[]
  }
}

export function StandingsTable({
  phaseId,
  groupId,
  title = "Clasificación",
  showPositionChanges = false,
  highlightPositions,
}: StandingsTableProps) {
  const [standings, setStandings] = useState<TeamStanding[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"position" | "points" | "goal_difference" | "goals_for">("position")

  useEffect(() => {
    fetchStandings()
  }, [phaseId, groupId])

  const fetchStandings = async () => {
    setLoading(true)
    try {
      // This would call the ResultsCalculator.getStandings() method
      // For now, we'll simulate with sample data
      const sampleStandings: TeamStanding[] = [
        {
          team_id: "1",
          team_name: "U. de Chile",
          matches_played: 10,
          wins: 7,
          draws: 2,
          losses: 1,
          goals_for: 21,
          goals_against: 8,
          goal_difference: 13,
          points: 23,
          position: 1,
          form: ["W", "W", "D", "W", "W"],
        },
        {
          team_id: "2",
          team_name: "Colo-Colo",
          matches_played: 10,
          wins: 6,
          draws: 3,
          losses: 1,
          goals_for: 18,
          goals_against: 9,
          goal_difference: 9,
          points: 21,
          position: 2,
          form: ["W", "D", "W", "W", "D"],
        },
        {
          team_id: "3",
          team_name: "U. Católica",
          matches_played: 10,
          wins: 5,
          draws: 4,
          losses: 1,
          goals_for: 16,
          goals_against: 10,
          goal_difference: 6,
          points: 19,
          position: 3,
          form: ["D", "W", "D", "W", "D"],
        },
      ]

      setStandings(sampleStandings)
    } catch (error) {
      console.error("Error fetching standings:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPositionBadge = (position: number) => {
    if (highlightPositions?.promotion?.includes(position)) {
      return <Badge className="bg-green-500">↑</Badge>
    }
    if (highlightPositions?.relegation?.includes(position)) {
      return <Badge variant="destructive">↓</Badge>
    }
    if (highlightPositions?.qualification?.includes(position)) {
      return <Badge className="bg-blue-500">Q</Badge>
    }
    return null
  }

  const getFormBadge = (result: string) => {
    switch (result) {
      case "W":
        return (
          <Badge className="bg-green-500 text-white w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
            W
          </Badge>
        )
      case "D":
        return (
          <Badge className="bg-yellow-500 text-white w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
            D
          </Badge>
        )
      case "L":
        return (
          <Badge variant="destructive" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
            L
          </Badge>
        )
      default:
        return null
    }
  }

  const sortedStandings = [...standings].sort((a, b) => {
    switch (sortBy) {
      case "points":
        return b.points - a.points
      case "goal_difference":
        return b.goal_difference - a.goal_difference
      case "goals_for":
        return b.goals_for - a.goals_for
      default:
        return a.position - b.position
    }
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="position">Posición</SelectItem>
                <SelectItem value="points">Puntos</SelectItem>
                <SelectItem value="goal_difference">Diferencia</SelectItem>
                <SelectItem value="goals_for">Goles a Favor</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchStandings}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {highlightPositions && (
          <CardDescription>
            <div className="flex items-center gap-4 text-xs">
              {highlightPositions.promotion && (
                <div className="flex items-center gap-1">
                  <Badge className="bg-green-500">↑</Badge>
                  <span>Promoción</span>
                </div>
              )}
              {highlightPositions.qualification && (
                <div className="flex items-center gap-1">
                  <Badge className="bg-blue-500">Q</Badge>
                  <span>Clasificación</span>
                </div>
              )}
              {highlightPositions.relegation && (
                <div className="flex items-center gap-1">
                  <Badge variant="destructive">↓</Badge>
                  <span>Descenso</span>
                </div>
              )}
            </div>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Pos</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead className="text-center w-12">PJ</TableHead>
              <TableHead className="text-center w-12">G</TableHead>
              <TableHead className="text-center w-12">E</TableHead>
              <TableHead className="text-center w-12">P</TableHead>
              <TableHead className="text-center w-12">GF</TableHead>
              <TableHead className="text-center w-12">GC</TableHead>
              <TableHead className="text-center w-12">DG</TableHead>
              <TableHead className="text-center w-12">Pts</TableHead>
              <TableHead className="text-center">Forma</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStandings.map((team) => (
              <TableRow key={team.team_id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {team.position}
                    {getPositionBadge(team.position)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{team.team_name}</TableCell>
                <TableCell className="text-center">{team.matches_played}</TableCell>
                <TableCell className="text-center">{team.wins}</TableCell>
                <TableCell className="text-center">{team.draws}</TableCell>
                <TableCell className="text-center">{team.losses}</TableCell>
                <TableCell className="text-center">{team.goals_for}</TableCell>
                <TableCell className="text-center">{team.goals_against}</TableCell>
                <TableCell className="text-center">
                  <span
                    className={
                      team.goal_difference > 0 ? "text-green-600" : team.goal_difference < 0 ? "text-red-600" : ""
                    }
                  >
                    {team.goal_difference > 0 ? "+" : ""}
                    {team.goal_difference}
                  </span>
                </TableCell>
                <TableCell className="text-center font-bold">{team.points}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-center">
                    {team.form.map((result, index) => (
                      <div key={index}>{getFormBadge(result)}</div>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
