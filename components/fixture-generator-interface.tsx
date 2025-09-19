"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Calendar, CheckCircle, Loader2, Play } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FixtureGenerator } from "@/lib/fixture-algorithms/fixture-generator"
import type { PhaseConfig, Team, FixtureGenerationResult } from "@/lib/fixture-algorithms/types"

interface FixtureGeneratorInterfaceProps {
  phaseId: string
  teams: Team[]
  onFixturesGenerated: (matches: any[]) => void
}

export function FixtureGeneratorInterface({ phaseId, teams, onFixturesGenerated }: FixtureGeneratorInterfaceProps) {
  const [config, setConfig] = useState<PhaseConfig>({
    phase_type: "league",
    home_away_legs: 1,
    rounds: 2,
    min_rest_days: 3,
    points_for_win: 3,
    points_for_draw: 1,
    points_for_loss: 0,
    has_consolation: false,
    groups_count: 4,
    teams_per_group: 4,
    qualified_per_group: 2,
    promoted_per_level: 2,
    relegated_per_level: 2,
  })

  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<FixtureGenerationResult | null>(null)
  const [previewMatches, setPreviewMatches] = useState<any[]>([])

  const handleGenerate = async () => {
    setGenerating(true)
    setResult(null)

    try {
      const generator = new FixtureGenerator(teams, config)
      const generationResult = await generator.generate()

      setResult(generationResult)

      if (generationResult.success) {
        // Convert matches to preview format
        const preview = generationResult.matches.slice(0, 10).map((match) => ({
          ...match,
          home_team_name: match.home_team_id ? teams.find((t) => t.id === match.home_team_id)?.name || "TBD" : "BYE",
          away_team_name: match.away_team_id ? teams.find((t) => t.id === match.away_team_id)?.name || "TBD" : null,
        }))
        setPreviewMatches(preview)
      }
    } catch (error) {
      setResult({
        matches: [],
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        metadata: {
          total_matches: 0,
          total_rounds: 0,
          algorithm_used: "unknown",
          generation_time_ms: 0,
          byes_generated: 0,
        },
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleConfirm = () => {
    if (result?.success) {
      onFixturesGenerated(result.matches)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Generador de Fixtures
          </CardTitle>
          <CardDescription>Configura los parámetros y genera el calendario de partidos para esta fase</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList>
              <TabsTrigger value="basic">Configuración Básica</TabsTrigger>
              <TabsTrigger value="advanced">Configuración Avanzada</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tipo de Fase</Label>
                  <Select
                    value={config.phase_type}
                    onValueChange={(value: any) => setConfig({ ...config, phase_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="league">Liga (Round Robin)</SelectItem>
                      <SelectItem value="knockout">Eliminatoria</SelectItem>
                      <SelectItem value="groups">Grupos</SelectItem>
                      <SelectItem value="levels">Niveles/Divisiones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Partidos por Enfrentamiento</Label>
                  <Select
                    value={config.home_away_legs.toString()}
                    onValueChange={(value) => setConfig({ ...config, home_away_legs: Number.parseInt(value) as 1 | 2 })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Partido único</SelectItem>
                      <SelectItem value="2">Ida y vuelta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {config.phase_type === "league" && (
                  <div className="space-y-2">
                    <Label>Vueltas</Label>
                    <Select
                      value={config.rounds.toString()}
                      onValueChange={(value) => setConfig({ ...config, rounds: Number.parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Una vuelta</SelectItem>
                        <SelectItem value="2">Dos vueltas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {config.phase_type === "groups" && (
                  <>
                    <div className="space-y-2">
                      <Label>Número de Grupos</Label>
                      <Input
                        type="number"
                        min="2"
                        max="8"
                        value={config.groups_count}
                        onChange={(e) => setConfig({ ...config, groups_count: Number.parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Clasificados por Grupo</Label>
                      <Input
                        type="number"
                        min="1"
                        max="4"
                        value={config.qualified_per_group}
                        onChange={(e) => setConfig({ ...config, qualified_per_group: Number.parseInt(e.target.value) })}
                      />
                    </div>
                  </>
                )}

                {config.phase_type === "knockout" && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="consolation"
                      checked={config.has_consolation}
                      onCheckedChange={(checked) => setConfig({ ...config, has_consolation: checked })}
                    />
                    <Label htmlFor="consolation">Incluir partido de consolación</Label>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Días mínimos de descanso</Label>
                  <Input
                    type="number"
                    min="1"
                    max="14"
                    value={config.min_rest_days}
                    onChange={(e) => setConfig({ ...config, min_rest_days: Number.parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Puntos por victoria</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={config.points_for_win}
                    onChange={(e) => setConfig({ ...config, points_for_win: Number.parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Puntos por empate</Label>
                  <Input
                    type="number"
                    min="0"
                    max="3"
                    value={config.points_for_draw}
                    onChange={(e) => setConfig({ ...config, points_for_draw: Number.parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Puntos por derrota</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    value={config.points_for_loss}
                    onChange={(e) => setConfig({ ...config, points_for_loss: Number.parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{teams.length} equipos registrados</div>
            <Button onClick={handleGenerate} disabled={generating || teams.length < 2}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Generar Fixtures
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Resultado de la Generación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.success ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{result.metadata.total_matches}</div>
                    <div className="text-sm text-muted-foreground">Partidos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{result.metadata.total_rounds}</div>
                    <div className="text-sm text-muted-foreground">Jornadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{result.metadata.byes_generated}</div>
                    <div className="text-sm text-muted-foreground">Descansos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{result.metadata.generation_time_ms}ms</div>
                    <div className="text-sm text-muted-foreground">Tiempo</div>
                  </div>
                </div>

                <Badge variant="secondary">Algoritmo: {result.metadata.algorithm_used}</Badge>

                {/* Preview */}
                {previewMatches.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Vista Previa (primeros 10 partidos)</h4>
                    <div className="space-y-2">
                      {previewMatches.map((match, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">J{match.round_number}</Badge>
                            <div className="text-sm">
                              {match.is_bye ? (
                                <span>
                                  {match.home_team_name} - <em>Descanso</em>
                                </span>
                              ) : (
                                <span>
                                  {match.home_team_name} vs {match.away_team_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={handleConfirm} className="flex-1">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar y Guardar Fixtures
                  </Button>
                  <Button variant="outline" onClick={() => setResult(null)}>
                    Generar Nuevamente
                  </Button>
                </div>
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Error al generar fixtures: {result.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
