"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Edit, Filter, Search } from "lucide-react"
import { MatchResultForm } from "./match-result-form"
import { StandingsTable } from "./standings-table"
import type { MatchResult } from "@/lib/results/types"

interface Match {
  id: string
  home_team: { id: string; name: string }
  away_team: { id: string; name: string }
  match_date: string
  venue?: { name: string }
  round_number: number
  status: string
  home_score?: number
  away_score?: number
  is_bye: boolean
}

interface MatchesManagementProps {
  phaseId: string
  groupId?: string
}

export function MatchesManagement({ phaseId, groupId }: MatchesManagementProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [showResultForm, setShowResultForm] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roundFilter, setRoundFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchMatches()
  }, [phaseId, groupId])

  useEffect(() => {
    applyFilters()
  }, [matches, statusFilter, roundFilter, searchTerm])

  const fetchMatches = async () => {
    setLoading(true)
    try {
      // This would fetch from Supabase
      // For now, we'll use sample data
      const sampleMatches: Match[] = [
        {
          id: "1",
          home_team: { id: "1", name: "U. de Chile" },
          away_team: { id: "2", name: "Colo-Colo" },
          match_date: "2024-03-15T20:00:00Z",
          venue: { name: "Estadio Nacional" },
          round_number: 1,
          status: "completed",
          home_score: 2,
          away_score: 1,
          is_bye: false,
        },
        {
          id: "2",
          home_team: { id: "3", name: "U. Católica" },
          away_team: { id: "4", name: "Wanderers" },
          match_date: "2024-03-16T18:00:00Z",
          venue: { name: "San Carlos de Apoquindo" },
          round_number: 1,
          status: "scheduled",
          is_bye: false,
        },
        {
          id: "3",
          home_team: { id: "5", name: "Palestino" },
          away_team: { id: "6", name: "La Serena" },
          match_date: "2024-03-17T16:00:00Z",
          venue: { name: "Santa Laura" },
          round_number: 1,
          status: "live",
          home_score: 1,
          away_score: 0,
          is_bye: false,
        },
      ]

      setMatches(sampleMatches)
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...matches]

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((match) => match.status === statusFilter)
    }

    // Round filter
    if (roundFilter !== "all") {
      filtered = filtered.filter((match) => match.round_number === Number.parseInt(roundFilter))
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (match) =>
          match.home_team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          match.away_team.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredMatches(filtered)
  }

  const handleResultSubmitted = async (result: MatchResult) => {
    try {
      // This would call the ResultsCalculator.recordMatchResult() method
      console.log("Recording result:", result)

      // Update local state
      setMatches(
        matches.map((match) =>
          match.id === result.match_id
            ? {
                ...match,
                home_score: result.home_score,
                away_score: result.away_score,
                status: result.status,
              }
            : match,
        ),
      )

      setShowResultForm(false)
      setSelectedMatch(null)
    } catch (error) {
      console.error("Error recording result:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline">Finalizado</Badge>
      case "live":
        return <Badge className="bg-red-500">En Vivo</Badge>
      case "scheduled":
        return <Badge variant="secondary">Programado</Badge>
      case "postponed":
        return <Badge variant="destructive">Postergado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const uniqueRounds = [...new Set(matches.map((match) => match.round_number))].sort((a, b) => a - b)

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="matches" className="space-y-6">
        <TabsList>
          <TabsTrigger value="matches">Partidos</TabsTrigger>
          <TabsTrigger value="standings">Clasificación</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar equipos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="scheduled">Programados</SelectItem>
                    <SelectItem value="live">En vivo</SelectItem>
                    <SelectItem value="completed">Finalizados</SelectItem>
                    <SelectItem value="postponed">Postergados</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={roundFilter} onValueChange={setRoundFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Jornada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las jornadas</SelectItem>
                    {uniqueRounds.map((round) => (
                      <SelectItem key={round} value={round.toString()}>
                        Jornada {round}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter("all")
                    setRoundFilter("all")
                    setSearchTerm("")
                  }}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Matches List */}
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <Card key={match.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <Badge variant="outline">J{match.round_number}</Badge>

                      <div className="flex items-center gap-4">
                        <div className="text-right min-w-32">
                          <div className="font-semibold">{match.home_team.name}</div>
                        </div>

                        <div className="text-center min-w-16">
                          {match.status === "completed" || match.status === "live" ? (
                            <div className="text-2xl font-bold">
                              {match.home_score} - {match.away_score}
                            </div>
                          ) : (
                            <div className="text-lg text-muted-foreground">vs</div>
                          )}
                        </div>

                        <div className="text-left min-w-32">
                          <div className="font-semibold">{match.away_team.name}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(match.match_date)}
                        </div>
                        {match.venue && <div className="text-sm text-muted-foreground">{match.venue.name}</div>}
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(match.status)}

                        {(match.status === "scheduled" || match.status === "live") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMatch(match)
                              setShowResultForm(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {match.status === "live" ? "Actualizar" : "Registrar"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMatches.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron partidos</h3>
                <p className="text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="standings">
          <StandingsTable
            phaseId={phaseId}
            groupId={groupId}
            title="Clasificación General"
            highlightPositions={{
              qualification: [1, 2, 3, 4],
              relegation: [11, 12],
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Result Form Dialog */}
      <Dialog open={showResultForm} onOpenChange={setShowResultForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Resultado del Partido</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <MatchResultForm
              match={selectedMatch}
              onResultSubmitted={handleResultSubmitted}
              onCancel={() => {
                setShowResultForm(false)
                setSelectedMatch(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
