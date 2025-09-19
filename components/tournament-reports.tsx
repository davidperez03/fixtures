"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Download, TrendingUp, Calendar, Users, Trophy, Target, Clock, MapPin } from "lucide-react"

interface TournamentReportsProps {
  tournamentId: string
}

export function TournamentReports({ tournamentId }: TournamentReportsProps) {
  const [reportData, setReportData] = useState<any>({
    overview: {
      totalMatches: 132,
      completedMatches: 45,
      totalGoals: 127,
      averageGoalsPerMatch: 2.82,
      totalCards: 89,
      attendanceRate: 78.5,
    },
    standings: [
      { team: "Colo-Colo", points: 28, matches: 12, wins: 9, draws: 1, losses: 2 },
      { team: "U. de Chile", points: 25, matches: 12, wins: 8, draws: 1, losses: 3 },
      { team: "U. Católica", points: 23, matches: 12, wins: 7, draws: 2, losses: 3 },
      { team: "Palestino", points: 20, matches: 12, wins: 6, draws: 2, losses: 4 },
      { team: "Huachipato", points: 18, matches: 12, wins: 5, draws: 3, losses: 4 },
    ],
    goalsPerRound: [
      { round: 1, goals: 24 },
      { round: 2, goals: 31 },
      { round: 3, goals: 28 },
      { round: 4, goals: 22 },
      { round: 5, goals: 22 },
    ],
    venueUtilization: [
      { venue: "Estadio Nacional", matches: 12, capacity: 45000, avgAttendance: 35000 },
      { venue: "Estadio Monumental", matches: 10, capacity: 47000, avgAttendance: 38000 },
      { venue: "Estadio San Carlos", matches: 8, capacity: 20000, avgAttendance: 16000 },
    ],
  })

  const exportReport = (format: "pdf" | "excel" | "csv") => {
    // Simulate export functionality
    console.log(`Exporting report in ${format} format`)
  }

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes del Torneo</h2>
          <p className="text-gray-600">Análisis detallado y estadísticas del campeonato</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport("pdf")}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport("excel")}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Progreso del Torneo</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {reportData.overview.completedMatches}/{reportData.overview.totalMatches}
                  </p>
                </div>
                <Progress
                  value={(reportData.overview.completedMatches / reportData.overview.totalMatches) * 100}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promedio de Goles</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.overview.averageGoalsPerMatch}</p>
                <p className="text-xs text-gray-500">por partido</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Asistencia Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.overview.attendanceRate}%</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5.2% vs anterior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Goles</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.overview.totalGoals}</p>
                <p className="text-xs text-gray-500">en {reportData.overview.completedMatches} partidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="standings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="standings">Clasificación</TabsTrigger>
          <TabsTrigger value="statistics">Estadísticas</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="standings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tabla de Posiciones</CardTitle>
              <CardDescription>Clasificación actual del torneo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.standings.map((team: any, index: number) => (
                  <div key={team.team} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{team.team}</p>
                        <p className="text-sm text-gray-600">{team.matches} partidos jugados</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-green-600">{team.wins}</p>
                        <p className="text-gray-500">G</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-yellow-600">{team.draws}</p>
                        <p className="text-gray-500">E</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-red-600">{team.losses}</p>
                        <p className="text-gray-500">P</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">{team.points}</p>
                        <p className="text-gray-500">Pts</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Goles por Jornada</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.goalsPerRound}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="round" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="goals" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Victorias Local", value: 18 },
                        { name: "Empates", value: 12 },
                        { name: "Victorias Visitante", value: 15 },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {[
                        { name: "Victorias Local", value: 18 },
                        { name: "Empates", value: 12 },
                        { name: "Victorias Visitante", value: 15 },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="venues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Utilización de Venues</CardTitle>
              <CardDescription>Estadísticas de uso y asistencia por estadio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.venueUtilization.map((venue: any) => (
                  <div key={venue.venue} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <h3 className="font-semibold">{venue.venue}</h3>
                      </div>
                      <Badge variant="outline">{venue.matches} partidos</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Asistencia promedio</span>
                        <span>{venue.avgAttendance.toLocaleString()}</span>
                      </div>
                      <Progress value={(venue.avgAttendance / venue.capacity) * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0</span>
                        <span>{((venue.avgAttendance / venue.capacity) * 100).toFixed(1)}% ocupación</span>
                        <span>{venue.capacity.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Rendimiento</CardTitle>
              <CardDescription>Métricas de rendimiento del torneo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-800">98.2%</p>
                  <p className="text-sm text-green-600">Partidos a tiempo</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-800">2.1</p>
                  <p className="text-sm text-blue-600">Tarjetas por partido</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-800">89%</p>
                  <p className="text-sm text-purple-600">Satisfacción general</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
