"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, Edit, Trash2, Users, MapPin, Loader2, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Team {
  id: string
  name: string
  short_name: string
  city: string
  country: string
  logo_url: string
  stadium: string
  created_at: string
}

interface Tournament {
  id: string
  name: string
  description: string
  status: string
}

interface TournamentTeamsProps {
  tournament: Tournament
  onBack: () => void
}

export function TournamentTeams({ tournament, onBack }: TournamentTeamsProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    city: "",
    country: "",
    stadium: "",
  })

  useEffect(() => {
    fetchTournamentTeams()
  }, [tournament.id])

  const fetchTournamentTeams = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("teams")
        .select(`
          *,
          phase_participants!inner(
            phase_id,
            phases!inner(
              tournament_id
            )
          )
        `)
        .eq("phase_participants.phases.tournament_id", tournament.id)
        .order("name", { ascending: true })

      if (error) throw error
      setTeams(data || [])
    } catch (error) {
      console.error("Error fetching tournament teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const supabase = createClient()

      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert([
          {
            ...formData,
            short_name: formData.short_name || formData.name.substring(0, 10),
          },
        ])
        .select()
        .single()

      if (teamError) throw teamError

      // Get or create a default phase for this tournament
      const { data: phases, error: phaseError } = await supabase
        .from("phases")
        .select("id")
        .eq("tournament_id", tournament.id)
        .limit(1)

      if (phaseError) throw phaseError

      let phaseId: string

      if (!phases || phases.length === 0) {
        // Create a default phase if none exists
        const { data: newPhase, error: newPhaseError } = await supabase
          .from("phases")
          .insert([
            {
              tournament_id: tournament.id,
              name: "Fase Principal",
              phase_type: "league",
              phase_order: 1,
            },
          ])
          .select("id")
          .single()

        if (newPhaseError) throw newPhaseError
        phaseId = newPhase.id
      } else {
        phaseId = phases[0].id
      }

      // Add team to tournament through phase_participants
      const { error: participantError } = await supabase.from("phase_participants").insert([
        {
          phase_id: phaseId,
          team_id: teamData.id,
        },
      ])

      if (participantError) throw participantError

      console.log("[v0] Team created and added to tournament successfully:", teamData)

      // Reset form and close dialog
      setFormData({
        name: "",
        short_name: "",
        city: "",
        country: "",
        stadium: "",
      })
      setShowCreateDialog(false)
      fetchTournamentTeams() // Refresh the list
    } catch (error) {
      console.error("Error creating team:", error)
      alert("Error al crear el equipo. Por favor intenta nuevamente.")
    } finally {
      setFormLoading(false)
    }
  }

  const handleRemoveTeam = async (teamId: string) => {
    if (!confirm("¿Estás seguro de que quieres remover este equipo del torneo?")) {
      return
    }

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("phase_participants")
        .delete()
        .eq("team_id", teamId)
        .in("phase_id", supabase.from("phases").select("id").eq("tournament_id", tournament.id))

      if (error) throw error

      fetchTournamentTeams() // Refresh the list
    } catch (error) {
      console.error("Error removing team from tournament:", error)
      alert("Error al remover el equipo del torneo.")
    }
  }

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.country?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="gap-2 bg-transparent">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h3 className="text-2xl font-bold">Equipos del Torneo</h3>
          <p className="text-muted-foreground">{tournament.name}</p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar equipos del torneo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar Equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Agregar Equipo al Torneo</DialogTitle>
              <DialogDescription>Crea un nuevo equipo y agrégalo a "{tournament.name}"</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Nombre del Equipo *</Label>
                <Input
                  id="team-name"
                  placeholder="Ej: Club Universidad de Chile"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short-name">Nombre Corto</Label>
                <Input
                  id="short-name"
                  placeholder="Ej: U. de Chile"
                  value={formData.short_name}
                  onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    placeholder="Santiago"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    placeholder="Chile"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stadium">Estadio</Label>
                <Input
                  id="stadium"
                  placeholder="Estadio Nacional"
                  value={formData.stadium}
                  onChange={(e) => setFormData({ ...formData, stadium: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Agregar al Torneo
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    {team.name}
                  </CardTitle>
                  {team.short_name && (
                    <Badge variant="secondary" className="mt-2">
                      {team.short_name}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(team.city || team.country) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{[team.city, team.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {team.stadium && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Estadio:</strong> {team.stadium}
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleRemoveTeam(team.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay equipos en este torneo</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Intenta ajustar el término de búsqueda" : "Agrega equipos para comenzar"}
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar Primer Equipo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
