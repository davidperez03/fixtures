"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Users, AlertTriangle, CheckCircle } from "lucide-react"

interface AdvancedTournamentSettingsProps {
  tournamentId: string
  onSettingsChange: (settings: any) => void
}

export function AdvancedTournamentSettings({ tournamentId, onSettingsChange }: AdvancedTournamentSettingsProps) {
  const [settings, setSettings] = useState({
    scheduling: {
      minRestDays: 3,
      maxMatchesPerDay: 8,
      preferredTimeSlots: [],
      blackoutDates: [],
      autoScheduling: true,
    },
    validation: {
      strictValidation: true,
      allowByes: true,
      requireVenues: false,
      checkConflicts: true,
    },
    advanced: {
      seedingMethod: "ranking",
      tiebreakRules: ["points", "goal_difference", "goals_for", "head_to_head"],
      promotionRelegation: false,
      playoffSystem: false,
    },
  })

  const [validationResults, setValidationResults] = useState<any[]>([])

  const handleSettingChange = (category: string, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category as keyof typeof settings],
        [key]: value,
      },
    }
    setSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const runValidation = async () => {
    // Simulate validation process
    const mockResults = [
      { type: "success", message: "Configuración de torneo válida" },
      { type: "warning", message: "Algunos equipos tendrán menos días de descanso" },
      { type: "info", message: "Se generarán 132 partidos en total" },
    ]
    setValidationResults(mockResults)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración Avanzada</h2>
          <p className="text-gray-600">Personaliza las reglas y validaciones del torneo</p>
        </div>
        <Button onClick={runValidation} variant="outline">
          <CheckCircle className="w-4 h-4 mr-2" />
          Validar Configuración
        </Button>
      </div>

      {validationResults.length > 0 && (
        <div className="space-y-2">
          {validationResults.map((result, index) => (
            <Alert
              key={index}
              className={
                result.type === "success"
                  ? "border-green-200 bg-green-50"
                  : result.type === "warning"
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-blue-200 bg-blue-50"
              }
            >
              <AlertDescription
                className={
                  result.type === "success"
                    ? "text-green-800"
                    : result.type === "warning"
                      ? "text-yellow-800"
                      : "text-blue-800"
                }
              >
                {result.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="scheduling" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduling">
            <Clock className="w-4 h-4 mr-2" />
            Programación
          </TabsTrigger>
          <TabsTrigger value="validation">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Validaciones
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Users className="w-4 h-4 mr-2" />
            Avanzado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Programación</CardTitle>
              <CardDescription>Define las reglas para la programación automática de partidos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minRestDays">Días mínimos de descanso</Label>
                  <Input
                    id="minRestDays"
                    type="number"
                    value={settings.scheduling.minRestDays}
                    onChange={(e) => handleSettingChange("scheduling", "minRestDays", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxMatchesPerDay">Máximo partidos por día</Label>
                  <Input
                    id="maxMatchesPerDay"
                    type="number"
                    value={settings.scheduling.maxMatchesPerDay}
                    onChange={(e) =>
                      handleSettingChange("scheduling", "maxMatchesPerDay", Number.parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autoScheduling"
                  checked={settings.scheduling.autoScheduling}
                  onCheckedChange={(checked) => handleSettingChange("scheduling", "autoScheduling", checked)}
                />
                <Label htmlFor="autoScheduling">Programación automática</Label>
              </div>

              <div className="space-y-2">
                <Label>Horarios Preferidos</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Sábado 15:00-17:00</Badge>
                  <Badge variant="secondary">Domingo 15:00-17:00</Badge>
                  <Button variant="outline" size="sm">
                    + Agregar Horario
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reglas de Validación</CardTitle>
              <CardDescription>Configura las validaciones que se aplicarán al torneo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="strictValidation"
                    checked={settings.validation.strictValidation}
                    onCheckedChange={(checked) => handleSettingChange("validation", "strictValidation", checked)}
                  />
                  <Label htmlFor="strictValidation">Validación estricta</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowByes"
                    checked={settings.validation.allowByes}
                    onCheckedChange={(checked) => handleSettingChange("validation", "allowByes", checked)}
                  />
                  <Label htmlFor="allowByes">Permitir byes automáticos</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="requireVenues"
                    checked={settings.validation.requireVenues}
                    onCheckedChange={(checked) => handleSettingChange("validation", "requireVenues", checked)}
                  />
                  <Label htmlFor="requireVenues">Requerir venues asignados</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="checkConflicts"
                    checked={settings.validation.checkConflicts}
                    onCheckedChange={(checked) => handleSettingChange("validation", "checkConflicts", checked)}
                  />
                  <Label htmlFor="checkConflicts">Verificar conflictos de programación</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
              <CardDescription>Opciones avanzadas para el comportamiento del torneo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Método de Seeding</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={settings.advanced.seedingMethod}
                  onChange={(e) => handleSettingChange("advanced", "seedingMethod", e.target.value)}
                >
                  <option value="ranking">Por ranking</option>
                  <option value="random">Aleatorio</option>
                  <option value="geographic">Por geografía</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Reglas de Desempate (en orden)</Label>
                <div className="flex flex-wrap gap-2">
                  {settings.advanced.tiebreakRules.map((rule, index) => (
                    <Badge key={index} variant="outline">
                      {index + 1}.{" "}
                      {rule === "points"
                        ? "Puntos"
                        : rule === "goal_difference"
                          ? "Diferencia de goles"
                          : rule === "goals_for"
                            ? "Goles a favor"
                            : "Enfrentamiento directo"}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="promotionRelegation"
                  checked={settings.advanced.promotionRelegation}
                  onCheckedChange={(checked) => handleSettingChange("advanced", "promotionRelegation", checked)}
                />
                <Label htmlFor="promotionRelegation">Sistema de ascenso/descenso</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="playoffSystem"
                  checked={settings.advanced.playoffSystem}
                  onCheckedChange={(checked) => handleSettingChange("advanced", "playoffSystem", checked)}
                />
                <Label htmlFor="playoffSystem">Sistema de playoffs</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
