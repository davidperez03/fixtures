"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Plus, Trophy, Users, Calendar, Settings, BarChart3 } from "lucide-react"
import { TournamentList } from "./tournament-list"
import { CreateTournamentDialog } from "./create-tournament-dialog"
import { TeamManagement } from "./team-management"
import { TournamentTeams } from "./tournament-teams"

interface Tournament {
  id: string
  name: string
  description: string
  status: string
}

export function TournamentDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)

  const handleViewTournamentTeams = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setActiveTab("tournament-teams")
  }

  const handleBackFromTournamentTeams = () => {
    setSelectedTournament(null)
    setActiveTab("tournaments")
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Trophy className="h-8 w-8 text-sidebar-primary" />
            <h1 className="text-xl font-bold text-sidebar-foreground">Fixture Manager</h1>
          </div>

          <nav className="space-y-2">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("overview")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === "tournaments" || activeTab === "tournament-teams" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("tournaments")}
            >
              <Trophy className="mr-2 h-4 w-4" />
              Torneos
            </Button>
            <Button
              variant={activeTab === "teams" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("teams")}
            >
              <Users className="mr-2 h-4 w-4" />
              Equipos Globales
            </Button>
            <Button
              variant={activeTab === "fixtures" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("fixtures")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Fixtures
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-balance">
                {activeTab === "overview" && "Dashboard General"}
                {activeTab === "tournaments" && "Gestión de Torneos"}
                {activeTab === "tournament-teams" && "Equipos del Torneo"}
                {activeTab === "teams" && "Gestión de Equipos Globales"}
                {activeTab === "fixtures" && "Gestión de Fixtures"}
                {activeTab === "settings" && "Configuración"}
              </h2>
              <p className="text-muted-foreground mt-2">
                {activeTab === "overview" && "Resumen de todos tus torneos y estadísticas"}
                {activeTab === "tournaments" && "Crea y administra tus torneos deportivos"}
                {activeTab === "tournament-teams" && "Gestiona los equipos específicos de este torneo"}
                {activeTab === "teams" && "Administra equipos globales del sistema"}
                {activeTab === "fixtures" && "Genera y gestiona calendarios de partidos"}
                {activeTab === "settings" && "Configura reglas y restricciones del sistema"}
              </p>
            </div>
            {activeTab === "tournaments" && (
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Torneo
              </Button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Torneos Activos</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground">Cargando estadísticas...</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Equipos Registrados</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground">Cargando estadísticas...</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Partidos Programados</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground">Próximamente disponible</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Próximos Partidos</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground">Próximamente disponible</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Comenzar</CardTitle>
                    <CardDescription>Pasos para configurar tu primer torneo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">1. Crear Equipos</p>
                        <p className="text-sm text-muted-foreground">Agrega los equipos que participarán</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("teams")}>
                        Ir a Equipos
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">2. Crear Torneo</p>
                        <p className="text-sm text-muted-foreground">Configura tu torneo deportivo</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("tournaments")}>
                        Ir a Torneos
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg opacity-50">
                      <div>
                        <p className="font-medium">3. Generar Fixtures</p>
                        <p className="text-sm text-muted-foreground">Próximamente disponible</p>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Próximamente
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                    <CardDescription>Últimas acciones en el sistema</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No hay actividad reciente</p>
                      <p className="text-sm">Crea tu primer torneo o equipo para comenzar</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tournaments">
              <TournamentList onViewTeams={handleViewTournamentTeams} />
            </TabsContent>

            <TabsContent value="tournament-teams">
              {selectedTournament && (
                <TournamentTeams tournament={selectedTournament} onBack={handleBackFromTournamentTeams} />
              )}
            </TabsContent>

            <TabsContent value="teams">
              <TeamManagement />
            </TabsContent>

            <TabsContent value="fixtures" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Fixtures</CardTitle>
                  <CardDescription>Genera y administra calendarios de partidos para tus torneos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Esta sección estará disponible en la siguiente fase del desarrollo.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración del Sistema</CardTitle>
                  <CardDescription>Configura reglas, restricciones y parámetros generales</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Esta sección estará disponible en la siguiente fase del desarrollo.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CreateTournamentDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  )
}
