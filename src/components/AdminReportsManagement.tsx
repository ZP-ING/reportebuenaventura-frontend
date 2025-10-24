import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { 
  FileText, Search, Trash2, Edit, Clock, CheckCircle2, TrendingUp, AlertCircle, X, Building2, Mail
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { reportsAPI, entitiesAPI } from '../utils/api';

interface Report {
  id: string;
  title: string;
  description: string;
  status: 'pendiente' | 'en-proceso' | 'resuelto' | 'rechazado';
  entityName: string;
  entityId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  location?: string;
  images?: string[];
  // Compatibilidad con respuesta del backend
  entity?: string;
}

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'en-proceso': { label: 'En Proceso', color: 'bg-blue-100 text-blue-800', icon: TrendingUp },
  resuelto: { label: 'Resuelto', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export function AdminReportsManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsResponse, entitiesResponse] = await Promise.all([
        reportsAPI.getAll(),
        entitiesAPI.getAll()
      ]);
      
      // Sort by most recent first
      const sortedReports = reportsResponse.reports.sort((a: Report, b: Report) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReports(sortedReports);
      setEntities(entitiesResponse.entities || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  // Handle report status change
  const handleStatusChange = async (reportId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No estás autenticado');
        return;
      }
      
      await reportsAPI.update(reportId, { status: newStatus }, token);
      
      const updatedReports = reports.map(r =>
        r.id === reportId ? { ...r, status: newStatus as Report['status'] } : r
      );
      setReports(updatedReports);
      window.dispatchEvent(new Event('reportUpdated'));
      toast.success('Estado del reporte actualizado');
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Error al actualizar el reporte');
    }
  };

  // Handle entity change
  const handleEntityChange = async (reportId: string, newEntityName: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No estás autenticado');
        return;
      }
      
      // Find entity ID
      const entity = entities.find(e => e.name === newEntityName);
      
      await reportsAPI.update(reportId, { 
        entityName: newEntityName,
        entityId: entity?.id || null
      }, token);
      
      const updatedReports = reports.map(r =>
        r.id === reportId ? { ...r, entityName: newEntityName, entity: newEntityName } : r
      );
      setReports(updatedReports);
      setEditingReport(null);
      window.dispatchEvent(new Event('reportUpdated'));
      toast.success('Entidad del reporte actualizada');
    } catch (error) {
      console.error('Error updating entity:', error);
      toast.error('Error al actualizar la entidad');
    }
  };

  // Delete report
  const handleDeleteReport = async () => {
    if (!deleteReportId) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No estás autenticado');
        return;
      }

      await reportsAPI.delete(deleteReportId, token);
      
      const updatedReports = reports.filter(r => r.id !== deleteReportId);
      setReports(updatedReports);
      setDeleteReportId(null);
      window.dispatchEvent(new Event('reportUpdated'));
      toast.success('Reporte eliminado');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Error al eliminar el reporte');
    }
  };

  const filteredReports = reports.filter(report => {
    const entityName = report.entityName || report.entity || '';
    const matchesSearch = 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entityName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2 border-green-200 shadow-lg bg-gradient-to-r from-green-50 to-yellow-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-yellow-400 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-green-800">Gestión de Reportes</CardTitle>
              <CardDescription>
                Administra el estado y asignación de todos los reportes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="border-2 border-green-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar reportes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-green-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 border-green-200">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en-proceso">En Proceso</SelectItem>
                <SelectItem value="resuelto">Resuelto</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card className="border-2 border-green-200">
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p>Cargando reportes...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron reportes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Ciudadano</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => {
                    const StatusIcon = STATUS_CONFIG[report.status].icon;
                    return (
                      <TableRow key={report.id}>
                        <TableCell className="text-xs text-gray-500">#{report.id.slice(0, 8)}</TableCell>
                        <TableCell className="max-w-xs">
                          <div>
                            <p className="truncate">{report.title}</p>
                            <p className="text-xs text-gray-500 truncate">{report.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{report.userName}</p>
                            <p className="text-xs text-gray-500">{report.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {report.entityName || report.entity || 'Sin asignar'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={report.status}
                            onValueChange={(value) => handleStatusChange(report.id, value)}
                          >
                            <SelectTrigger className="w-36">
                              <Badge className={STATUS_CONFIG[report.status].color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {STATUS_CONFIG[report.status].label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="en-proceso">En Proceso</SelectItem>
                              <SelectItem value="resuelto">Resuelto</SelectItem>
                              <SelectItem value="rechazado">Rechazado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(report.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingReport(report)}
                              className="border-green-200 hover:bg-green-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteReportId(report.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Entity Dialog */}
      <Dialog open={!!editingReport} onOpenChange={() => setEditingReport(null)}>
        <DialogContent className="border-2 border-green-200 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-green-800">Reasignar Entidad</DialogTitle>
                <DialogDescription>
                  Selecciona la nueva entidad responsable del reporte
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingReport(null)}
                className="hover:bg-green-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          {editingReport && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-yellow-50 border-2 border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Reporte:</p>
                <p className="text-lg text-green-900 mb-2"><strong>{editingReport.title}</strong></p>
                <p className="text-sm text-gray-600">
                  Entidad actual: <span className="text-green-700"><strong>{editingReport.entityName || editingReport.entity || 'Sin asignar'}</strong></span>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {entities.map((entity: any) => {
                  const currentEntityName = editingReport.entityName || editingReport.entity || '';
                  const isSelected = currentEntityName === entity.name;
                  return (
                  <Card 
                    key={entity.id} 
                    className={`cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'border-green-500 bg-green-50' 
                        : 'border-green-200 hover:border-green-400 hover:shadow-md'
                    }`}
                    onClick={() => handleEntityChange(editingReport.id, entity.name)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected
                            ? 'bg-gradient-to-br from-green-500 to-yellow-400'
                            : 'bg-gray-200'
                        }`}>
                          <Building2 className={`w-5 h-5 ${
                            isSelected ? 'text-white' : 'text-gray-500'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base text-green-900">{entity.name}</CardTitle>
                          <Badge className="mt-2 bg-green-600 text-white">
                            {entity.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">{entity.description}</p>
                      {entity.email && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {entity.email}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteReportId} onOpenChange={() => setDeleteReportId(null)}>
        <AlertDialogContent className="border-2 border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-800">¿Eliminar reporte?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El reporte será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-green-200 hover:bg-green-50">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReport}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
