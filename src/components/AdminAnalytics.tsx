import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { 
  FileText, Clock, CheckCircle2, TrendingUp, 
  Building2, AlertCircle
} from 'lucide-react';
import { reportsAPI, entitiesAPI } from '../utils/api';
import { toast } from 'sonner@2.0.3';

const COLORS = ['#10b981', '#fbbf24', '#f59e0b', '#ef4444', '#84cc16'];

const TIMELINE_DATA = [
  { date: '10 Oct', reportes: 12, resueltos: 8 },
  { date: '11 Oct', reportes: 15, resueltos: 10 },
  { date: '12 Oct', reportes: 18, resueltos: 14 },
  { date: '13 Oct', reportes: 14, resueltos: 16 },
  { date: '14 Oct', reportes: 20, resueltos: 15 },
  { date: '15 Oct', reportes: 22, resueltos: 18 },
  { date: '16 Oct', reportes: 19, resueltos: 20 },
  { date: '17 Oct', reportes: 25, resueltos: 22 },
];

interface Report {
  id: string;
  title: string;
  description: string;
  status: 'pendiente' | 'en-proceso' | 'resuelto' | 'rechazado';
  entity: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}

export function AdminAnalytics() {
  const [timeFilter, setTimeFilter] = useState('7d');
  const [reports, setReports] = useState<Report[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No estás autenticado');
        return;
      }

      const [reportsResponse, entitiesResponse] = await Promise.all([
        reportsAPI.getAll(token),
        entitiesAPI.getAll()
      ]);

      setReports(reportsResponse.reports || []);
      setEntities(entitiesResponse.entities || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Error al cargar las analíticas');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalReports = reports.length;
  const pendingReports = reports.filter(r => r.status === 'pendiente').length;
  const inProgressReports = reports.filter(r => r.status === 'en-proceso').length;
  const resolvedReports = reports.filter(r => r.status === 'resuelto').length;
  const resolutionRate = totalReports > 0 ? ((resolvedReports / totalReports) * 100).toFixed(1) : '0';

  // Category data for charts
  const categoryData = reports.reduce((acc: any[], report) => {
    const entityName = report.entityName || report.entity || 'Sin asignar';
    const existing = acc.find(item => item.name === entityName);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: entityName, value: 1 });
    }
    return acc;
  }, []);

  // Status data for pie chart
  const statusData = [
    { name: 'Pendiente', value: reports.filter(r => r.status === 'pendiente').length },
    { name: 'En Proceso', value: reports.filter(r => r.status === 'en-proceso').length },
    { name: 'Resuelto', value: reports.filter(r => r.status === 'resuelto').length },
    { name: 'Rechazado', value: reports.filter(r => r.status === 'rechazado').length },
  ].filter(item => item.value > 0);

  // Get entity names
  const entityNames = entities.map((e: any) => e.name);

  // Entity performance data
  const entityPerformance = entityNames.map((entity: string) => {
    const entityReports = reports.filter(r => r.entity === entity);
    return {
      entity,
      pending: entityReports.filter(r => r.status === 'pendiente').length,
      inProcess: entityReports.filter(r => r.status === 'en-proceso').length,
      resolved: entityReports.filter(r => r.status === 'resuelto').length,
      total: entityReports.length,
    };
  }).filter(e => e.total > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2 border-green-200 shadow-lg bg-gradient-to-r from-green-50 to-yellow-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-yellow-400 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-green-800">Análisis y Métricas</CardTitle>
                <CardDescription>
                  Vista general de reportes y estadísticas del sistema
                </CardDescription>
              </div>
            </div>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32 border-green-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 horas</SelectItem>
                <SelectItem value="7d">7 días</SelectItem>
                <SelectItem value="30d">30 días</SelectItem>
                <SelectItem value="1y">1 año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando analíticas...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 border-green-200 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reportes</p>
                    <p className="text-3xl text-green-800 mt-1">{totalReports}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-yellow-400 p-3 rounded-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

        <Card className="border-2 border-yellow-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-3xl text-yellow-600 mt-1">{pendingReports}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-400 to-orange-400 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Proceso</p>
                <p className="text-3xl text-blue-600 mt-1">{inProgressReports}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-300 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasa Resolución</p>
                <p className="text-3xl text-green-600 mt-1">{resolutionRate}%</p>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-green-700 p-3 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Distribución por Estado</CardTitle>
            <CardDescription>Estados actuales de todos los reportes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reports by Entity */}
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Reportes por Entidad</CardTitle>
            <CardDescription>Cantidad de reportes asignados a cada entidad</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">Tendencia de Reportes</CardTitle>
          <CardDescription>Evolución de reportes creados vs resueltos</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={TIMELINE_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="reportes" stroke="#10b981" strokeWidth={2} name="Reportes Creados" />
              <Line type="monotone" dataKey="resueltos" stroke="#fbbf24" strokeWidth={2} name="Reportes Resueltos" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Entity Performance */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">Rendimiento por Entidad</CardTitle>
          <CardDescription>Estado de reportes agrupados por entidad responsable</CardDescription>
        </CardHeader>
        <CardContent>
          {entityPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={entityPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="entity" angle={-45} textAnchor="end" height={120} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pending" stackId="a" fill="#fbbf24" name="Pendientes" />
                <Bar dataKey="inProcess" stackId="a" fill="#3b82f6" name="En Proceso" />
                <Bar dataKey="resolved" stackId="a" fill="#10b981" name="Resueltos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay datos de entidades disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}
