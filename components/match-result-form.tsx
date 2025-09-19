"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Plus, Save, Clock, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { MatchResult, MatchEvent } from "@/lib/results/types"

interface Match {
  id: string
  home_team: { id: string; name: string }
  away_team: { id: string; name: string }
  match_date: string
  status: string
  home_score?: number
  away_score?: number
}

interface MatchResultFormProps {
  match: Match
  onResultSubmitted: (result: MatchResult) => void
  onCancel: () => void
}

export function MatchResultForm({ match, onResultSubmitted, onCancel }: MatchResultFormProps) {
  const [result, setResult] = useState<MatchResult>({
    match_id: match.id,
    home_score: match.home_score || 0,
    away_score: match.away_score || 0,
    status: "completed",
  })

  const [hasExtraTime, setHasExtraTime] = useState(false)
  const [hasPenalties, setHasPenalties] = useState(false)
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [newEvent, setNewEvent] = useState<Partial<MatchEvent>>({
    team_id: match.home_team.id,
    event_type: "goal",
    minute: 0,
    player_name: "",
    description: "",
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Validate scores
      if (result.home_score < 0 || result.away_score < 0) {
        throw new Error("Los goles no pueden ser negativos")
      }

      // Add events to result
      const finalResult: MatchResult = {
        ...result,
        match_events: events.length > 0 ? events : undefined,
      }

      await onResultSubmitted(finalResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setSubmitting(false)
    }
  }

  const addEvent = () => {
    if (!newEvent.minute || !newEvent.player_name) return

    const event: MatchEvent = {
      match_id: match.id,
      team_id: newEvent.team_id!,
      event_type: newEvent.event_type!,
      minute: newEvent.minute,
      player_name: newEvent.player_name,
      description: newEvent.description,
    }

    setEvents([...events, event])
    setNewEvent({
      team_id: match.home_team.id,
      event_type: "goal",
      minute: 0,
      player_name: "",
      description: "",
    })
  }

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index))
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "goal":
        return "⚽"
      case "yellow_card":
        return "🟨"
      case "red_card":
        return "🟥"
      case "substitution":
        return "🔄"
      default:
        return "📝"
    }
  }

  const getEventLabel = (type: string) => {
    switch (type) {
      case "goal":
        return "Gol"
      case "yellow_card":
        return "Tarjeta Amarilla"
      case "red_card":
        return "Tarjeta Roja"
      case "substitution":
        return "Sustitución"
      default:
        return "Otro"
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Registrar Resultado
        </CardTitle>
        <CardDescription>
          {match.home_team.name} vs {match.away_team.name}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="result" className="space-y-6">
            <TabsList>
              <TabsTrigger value="result">Resultado</TabsTrigger>
              <TabsTrigger value="events">Eventos</TabsTrigger>
            </TabsList>

            <TabsContent value="result" className="space-y-6">
              {/* Main Result */}
              <div className="grid grid-cols-3 gap-6 items-center">
                <div className="text-center">
                  <Label className="text-lg font-semibold">{match.home_team.name}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={result.home_score}
                    onChange={(e) => setResult({ ...result, home_score: Number.parseInt(e.target.value) || 0 })}
                    className="text-center text-2xl font-bold mt-2"
                  />
                </div>

                <div className="text-center">
                  <div className="text-4xl font-bold text-muted-foreground">VS</div>
                </div>

                <div className="text-center">
                  <Label className="text-lg font-semibold">{match.away_team.name}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={result.away_score}
                    onChange={(e) => setResult({ ...result, away_score: Number.parseInt(e.target.value) || 0 })}
                    className="text-center text-2xl font-bold mt-2"
                  />
                </div>
              </div>

              <Separator />

              {/* Extra Time */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="extra-time"
                    checked={hasExtraTime}
                    onCheckedChange={(checked) => {
                      setHasExtraTime(checked)
                      if (!checked) {
                        setResult({ ...result, home_score_et: undefined, away_score_et: undefined })
                      }
                    }}
                  />
                  <Label htmlFor="extra-time">Tiempo Extra</Label>
                </div>

                {hasExtraTime && (
                  <div className="grid grid-cols-3 gap-6 items-center">
                    <div className="text-center">
                      <Label>Goles en Tiempo Extra</Label>
                      <Input
                        type="number"
                        min="0"
                        value={result.home_score_et || 0}
                        onChange={(e) => setResult({ ...result, home_score_et: Number.parseInt(e.target.value) || 0 })}
                        className="text-center mt-2"
                      />
                    </div>
                    <div></div>
                    <div className="text-center">
                      <Label>Goles en Tiempo Extra</Label>
                      <Input
                        type="number"
                        min="0"
                        value={result.away_score_et || 0}
                        onChange={(e) => setResult({ ...result, away_score_et: Number.parseInt(e.target.value) || 0 })}
                        className="text-center mt-2"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Penalties */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="penalties"
                    checked={hasPenalties}
                    onCheckedChange={(checked) => {
                      setHasPenalties(checked)
                      if (!checked) {
                        setResult({ ...result, home_score_pen: undefined, away_score_pen: undefined })
                      }
                    }}
                  />
                  <Label htmlFor="penalties">Penales</Label>
                </div>

                {hasPenalties && (
                  <div className="grid grid-cols-3 gap-6 items-center">
                    <div className="text-center">
                      <Label>Penales Convertidos</Label>
                      <Input
                        type="number"
                        min="0"
                        value={result.home_score_pen || 0}
                        onChange={(e) => setResult({ ...result, home_score_pen: Number.parseInt(e.target.value) || 0 })}
                        className="text-center mt-2"
                      />
                    </div>
                    <div></div>
                    <div className="text-center">
                      <Label>Penales Convertidos</Label>
                      <Input
                        type="number"
                        min="0"
                        value={result.away_score_pen || 0}
                        onChange={(e) => setResult({ ...result, away_score_pen: Number.parseInt(e.target.value) || 0 })}
                        className="text-center mt-2"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Match Status */}
              <div className="space-y-2">
                <Label>Estado del Partido</Label>
                <Select value={result.status} onValueChange={(value: any) => setResult({ ...result, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Finalizado</SelectItem>
                    <SelectItem value="live">En Vivo</SelectItem>
                    <SelectItem value="suspended">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              {/* Add Event Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Agregar Evento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Equipo</Label>
                      <Select
                        value={newEvent.team_id}
                        onValueChange={(value) => setNewEvent({ ...newEvent, team_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={match.home_team.id}>{match.home_team.name}</SelectItem>
                          <SelectItem value={match.away_team.id}>{match.away_team.name}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={newEvent.event_type}
                        onValueChange={(value: any) => setNewEvent({ ...newEvent, event_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="goal">⚽ Gol</SelectItem>
                          <SelectItem value="yellow_card">🟨 Tarjeta Amarilla</SelectItem>
                          <SelectItem value="red_card">🟥 Tarjeta Roja</SelectItem>
                          <SelectItem value="substitution">🔄 Sustitución</SelectItem>
                          <SelectItem value="other">📝 Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Minuto</Label>
                      <Input
                        type="number"
                        min="0"
                        max="120"
                        value={newEvent.minute}
                        onChange={(e) => setNewEvent({ ...newEvent, minute: Number.parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Jugador</Label>
                      <Input
                        value={newEvent.player_name}
                        onChange={(e) => setNewEvent({ ...newEvent, player_name: e.target.value })}
                        placeholder="Nombre del jugador"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción (opcional)</Label>
                    <Textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Detalles adicionales del evento"
                      rows={2}
                    />
                  </div>

                  <Button type="button" onClick={addEvent} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Evento
                  </Button>
                </CardContent>
              </Card>

              {/* Events List */}
              {events.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Eventos del Partido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {events.map((event, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{event.minute}'</Badge>
                            <span className="text-lg">{getEventIcon(event.event_type)}</span>
                            <div>
                              <div className="font-medium">{event.player_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {getEventLabel(event.event_type)}
                                {event.description && ` - ${event.description}`}
                              </div>
                            </div>
                          </div>
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeEvent(index)}>
                            Eliminar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Resultado
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
