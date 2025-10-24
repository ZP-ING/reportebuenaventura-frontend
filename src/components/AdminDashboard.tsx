import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { 
  FileText, Clock, CheckCircle2, TrendingUp, 
  Building2, AlertCircle, Trash2, Edit, Users as UsersIcon, Search
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { toast } from 'sonner@2.0.3';

const COLORS = ['#10b981', '#fbbf24', '#f59e0b', '#ef4444', '#84cc16'];

const ENTITIES = [
  'Alcaldía - Infraestructura',
  'Alcaldía - Servicios Públicos',
  'Alcaldía - Aseo',
  'Empresa de Acueducto',
  'Empresa de Aseo',
  'Policía',
  'Bomberos',
  'Hospital',
  'Alcaldía General',
];

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

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'ciudadano';
  createdAt: string;
}

export function AdminDashboard() {
  const [timeFilter, setTimeFilter] = useState('30d');
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedReports = JSON.parse(localStorage.getItem('reports') || '[]');
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setReports(storedReports);
    setUsers(storedUsers);
  };

  // Calculate statistics
  const totalReports = reports.length;
  const pendingReports = reports.filter(r => r.status === 'pendiente').length;
  const resolvedReports = reports.filter(r => r.status === 'resuelto').length;
  const resolutionRate = totalReports > 0 ? ((resolvedReports / totalReports) * 100).toFixed(1) : '0';

  // Category data for charts
  const categoryData = reports.reduce((acc: any[], report) => {
    const existing = acc.find(item => item.name === report.entity);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: report.entity, value: 1 });
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

  // Entity performance data
  const entityPerformance = ENTITIES.map(entity => {
    const entityReports = reports.filter(r => r.entity === entity);
    return {
      entity,
      pending: entityReports.filter(r => r.status === 'pendiente').length,
      inProcess: entityReports.filter(r => r.status === 'en-proceso').length,
      resolved: entityReports.filter(r => r.status === 'resuelto').length,
      total: entityReports.length,
    };
  }).filter(e => e.total > 0);

  // Handle report status change
  const handleStatusChange = (reportId: string, newStatus: string) => {
    const updatedReports = reports.map(r =>
      r.id === reportId ? { ...r, status: newStatus as Report['status'] } : r
    );
    localStorage.setItem('reports', JSON.stringify(updatedReports));
    setReports(updatedReports);
    toast.success('Estado del reporte actualizado');
  };

  // Handle entity change
  const handleEntityChange = (reportId: string, newEntity: string) => {
    const updatedReports = reports.map(r =>
      r.id === reportId ? { ...r, entity: newEntity } : r
    );
    localStorage.setItem('reports', JSON.stringify(updatedReports));
    setReports(updatedReports);
    setEditingReport(null);
    toast.success('Entidad del reporte actualizada');
  };

  // Delete report
  const handleDeleteReport = () => {
    if (!deleteReportId) return;
    
    const updatedReports = reports.filter(r => r.id !== deleteReportId);
    localStorage.setItem('reports', JSON.stringify(updatedReports));
    setReports(updatedReports);
    setDeleteReportId(null);
    toast.success('Reporte eliminado');
  };

  // Delete user
  const handleDeleteUser = () => {
    if (!deleteUserId) return;
    
    const updatedUsers = users.filter(u => u.id !== deleteUserId);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    
    // Also delete all reports from this user
    const updatedReports = reports.filter(r => r.userId !== deleteUserId);
    localStorage.setItem('reports', JSON.stringify(updatedReports));
    setReports(updatedReports);
    
    setDeleteUserId(null);
    toast.success('Usuario y sus reportes eliminados');
  };

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="bg-gradient-to-r from-green-600 via-yellow-500 to-lime-600 bg-clip-text text-transparent">
            Dashboard Administrativo
          </h2>
          <p className="text-gray-600">Vista general de reportes y métricas del sistema</p>
        </div>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-40 border-green-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 días</SelectItem>
            <SelectItem value="30d">Últimos 30 días</SelectItem>
            <SelectItem value="90d">Últimos 90 días</SelectItem>
            <SelectItem value="1y">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reportes</p>
                <h3 className="text-green-800 mt-1">{totalReports}</h3>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-yellow-400 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>Sistema activo</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <h3 className="text-green-800 mt-1">{pendingReports}</h3>
              </div>
              <div className="bg-gradient-to-br from-yellow-400 to-orange-400 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Requieren atención
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-lime-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasa de Resolución</p>
                <h3 className="text-green-800 mt-1">{resolutionRate}%</h3>
              </div>
              <div className="bg-gradient-to-br from-lime-500 to-green-500 p-3 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {resolvedReports} reportes resueltos
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuarios</p>
                <h3 className="text-green-800 mt-1">{users.length}</h3>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-lime-500 p-3 rounded-lg">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Ciudadanos registrados
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white border-2 border-green-200">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-yellow-400 data-[state=active]:text-white">
            Análisis y Métricas
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-yellow-400 data-[state=active]:text-white">
            Gestión de Reportes
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-yellow-400 data-[state=active]:text-white">
            Gestión de Usuarios
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reports by Entity */}
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">Reportes por Entidad</CardTitle>
                <CardDescription>Distribución de reportes según entidad responsable</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#bbf7d0" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Reports by Status */}
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">Estado de Reportes</CardTitle>
                <CardDescription>Distribución por estado actual</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
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
          </div>

          {/* Timeline */}
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Tendencias en el Tiempo</CardTitle>
              <CardDescription>
                Reportes creados vs resueltos en los últimos días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={TIMELINE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#bbf7d0" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="reportes" 
                    stroke="#fbbf24" 
                    strokeWidth={3}
                    name="Reportes Creados"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resueltos" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Reportes Resueltos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Entity Performance */}
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Rendimiento por Entidad</CardTitle>
              <CardDescription>
                Métricas de atención de cada entidad responsable
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entityPerformance.map((entity, index) => (
                  <div key={index} className="border-2 border-green-100 rounded-lg p-4 hover:border-green-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-green-600" />
                        <h4 className="text-green-900">{entity.entity}</h4>
                      </div>
                      <Badge variant="outline" className="bg-green-50">
                        Total: {entity.total}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-600">Pendientes</p>
                        <p className="text-yellow-600">{entity.pending}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">En Proceso</p>
                        <p className="text-blue-600">{entity.inProcess}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Resueltos</p>
                        <p className="text-green-600">{entity.resolved}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-green-500 to-lime-500 h-3 rounded-full transition-all"
                          style={{
                            width: `${entity.total > 0 ? (entity.resolved / entity.total) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Management */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="border-2 border-green-200">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-green-800">Todos los Reportes</CardTitle>
                  <CardDescription>Gestiona el estado y asignación de reportes</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar reportes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-green-200"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-green-800">ID</TableHead>
                      <TableHead className="text-green-800">Título</TableHead>
                      <TableHead className="text-green-800">Usuario</TableHead>
                      <TableHead className="text-green-800">Estado</TableHead>
                      <TableHead className="text-green-800">Entidad</TableHead>
                      <TableHead className="text-right text-green-800">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="text-xs text-gray-500">#{report.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="max-w-xs truncate text-green-900">{report.title}</p>
                            <p className="text-xs text-gray-500">{report.userName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{report.userEmail}</TableCell>
                        <TableCell>
                          <Select
                            value={report.status}
                            onValueChange={(value) => handleStatusChange(report.id, value)}
                          >
                            <SelectTrigger className="w-32 border-green-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="en-proceso">En Proceso</SelectItem>
                              <SelectItem value="resuelto">Resuelto</SelectItem>
                              <SelectItem value="rechazado">Rechazado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {editingReport?.id === report.id ? (
                            <Select
                              value={report.entity}
                              onValueChange={(value) => handleEntityChange(report.id, value)}
                            >
                              <SelectTrigger className="w-48 border-green-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ENTITIES.map((entity) => (
                                  <SelectItem key={entity} value={entity}>
                                    {entity}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm truncate max-w-[150px]">{report.entity}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingReport(report)}
                                className="hover:bg-green-50"
                              >
                                <Edit className="w-3 h-3 text-green-600" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteReportId(report.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Management */}
        <TabsContent value="users" className="space-y-4">
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Gestión de Usuarios</CardTitle>
              <CardDescription>Administra los usuarios registrados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-green-800">ID</TableHead>
                      <TableHead className="text-green-800">Nombre</TableHead>
                      <TableHead className="text-green-800">Email</TableHead>
                      <TableHead className="text-green-800">Rol</TableHead>
                      <TableHead className="text-green-800">Reportes</TableHead>
                      <TableHead className="text-right text-green-800">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const userReports = reports.filter(r => r.userId === user.id).length;
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="text-xs text-gray-500">#{user.id}</TableCell>
                          <TableCell className="text-green-900">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.role === 'admin' ? 'default' : 'secondary'}
                              className={user.role === 'admin' ? 'bg-gradient-to-r from-green-500 to-yellow-400 text-white' : ''}
                            >
                              {user.role === 'admin' ? 'Admin' : 'Ciudadano'}
                            </Badge>
                          </TableCell>
                          <TableCell>{userReports}</TableCell>
                          <TableCell className="text-right">
                            {user.role !== 'admin' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteUserId(user.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Report Dialog */}
      <AlertDialog open={!!deleteReportId} onOpenChange={() => setDeleteReportId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reporte?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El reporte será eliminado permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReport} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario y todos sus reportes serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
