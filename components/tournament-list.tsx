"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Edit, Trash2, Play, Pause, Trophy, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Tournament {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  status: string
  tournament_type: string
  created_at: string
}

interface TournamentListProps {
  onViewTeams?: (tournament: Tournament) => void
}

export function TournamentList({ onViewTeams }: TournamentListProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchTournaments()
  }, [])

  const fetchTournaments = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("tournaments").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setTournaments(data || [])
    } catch (error) {
      console.error("Error fetching tournaments:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Activo</Badge>
      case "completed":
        return <Badge variant="outline">Completado</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="secondary">Borrador</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "single_phase":
        return "Fase Única"
      case "multi_phase":
        return "Multi-Fase"
      default:
        return "Desconocido"
    }
  }

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch =
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || tournament.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar torneos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="completed">Completado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tournament Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTournaments.map((tournament) => (
          <Card key={tournament.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    {tournament.name}
                  </CardTitle>
                  <CardDescription className="mt-2">{tournament.description || "Sin descripción"}</CardDescription>
                </div>
                {getStatusBadge(tournament.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span>{getTypeLabel(tournament.tournament_type)}</span>
                </div>
                {tournament.start_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Inicio:</span>
                    <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                  </div>
                )}
                {tournament.end_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fin:</span>
                    <span>{new Date(tournament.end_date).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="space-y-2 pt-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => onViewTeams?.(tournament)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Equipos
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {tournament.status === "draft" && (
                      <Button variant="default" size="sm" className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar
                      </Button>
                    )}
                    {tournament.status === "active" && (
                      <Button variant="secondary" size="sm" className="flex-1">
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </Button>
                    )}
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTournaments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron torneos</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Crea tu primer torneo para comenzar"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
