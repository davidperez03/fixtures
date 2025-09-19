"use client"

import { useState } from "react"
import { AdvancedTournamentSettings } from "@/components/advanced-tournament-settings"
import { TournamentReports } from "@/components/tournament-reports"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, BarChart3, Cog } from "lucide-react"

interface AdvancedTournamentPageProps {
  params: {
    id: string
  }
}

export default function AdvancedTournamentPage({ params }: AdvancedTournamentPageProps) {
  const [activeTab, setActiveTab] = useState("settings")

  const handleSettingsChange = (settings: any) => {
    console.log("[v0] Advanced settings updated:", settings)
    // Here you would save the settings to the database
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración Avanzada del Torneo</h1>
          <p className="mt-2 text-gray-600">Gestiona configuraciones avanzadas, validaciones y reportes detallados</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Configuración</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Reportes</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Cog className="w-4 h-4" />
              <span>Sistema</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <AdvancedTournamentSettings tournamentId={params.id} onSettingsChange={handleSettingsChange} />
          </TabsContent>

          <TabsContent value="reports">
            <TournamentReports tournamentId={params.id} />
          </TabsContent>

          <TabsContent value="system">
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Estado del Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="font-semibold text-green-800">Base de Datos</p>
                    <p className="text-sm text-green-600">Conectada y funcionando</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="font-semibold text-green-800">Algoritmos</p>
                    <p className="text-sm text-green-600">Todos los algoritmos operativos</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-semibold text-blue-800">Validaciones</p>
                    <p className="text-sm text-blue-600">Sistema de validación activo</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="font-semibold text-purple-800">Reportes</p>
                    <p className="text-sm text-purple-600">Generación automática habilitada</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
