import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MapPin, Calendar, Eye, Search, Filter, X, Plus, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { ShareButtons } from './ShareButtons';
import { reportsAPI, commentsAPI } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  locationLat?: number;
  locationLng?: number;
  location?: string;
  images?: string[];
  status: 'pendiente' | 'en-proceso' | 'resuelto' | 'rechazado';
  entityName: string;
  entityId?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  createdAt: string;
  manuallyAssigned?: boolean;
  aiClassification?: {
    confidence: number;
    reasoning: string;
  };
  rating?: number;
  ratingComment?: string;
  // Compatibilidad con formato antiguo
  entity?: string;
  address?: string;
  image?: string;
}

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  'en-proceso': { label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
  resuelto: { label: 'Resuelto', color: 'bg-green-100 text-green-800' },
  rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
};

export function PublicReportsTracking() {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getAll();
      // Ordenar por fecha más reciente
      const sortedReports = response.reports.sort((a: Report, b: Report) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReports(sortedReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const entityName = report.entityName || report.entity || '';
    const location = report.location || report.address || '';
    const matchesSearch = 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entityName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load comment counts for all reports
    const loadCommentCounts = async () => {
      const counts: Record<string, number> = {};
      for (const report of reports) {
        try {
          const response = await commentsAPI.getAll(report.id);
          counts[report.id] = response.comments.length;
        } catch {
          counts[report.id] = 0;
        }
      }
      setCommentCounts(counts);
    };
    
    if (reports.length > 0) {
      loadCommentCounts();
    }
  }, [reports]);

  const getCommentCount = (reportId: string) => {
    return commentCounts[reportId] || 0;
  };

  const stats = {
    total: reports.length,
    pendiente: reports.filter(r => r.status === 'pendiente').length,
    enProceso: reports.filter(r => r.status === 'en-proceso').length,
    resuelto: reports.filter(r => r.status === 'resuelto').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Reportes</p>
              <p className="text-3xl text-green-800 mt-2">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-3xl text-yellow-600 mt-2">{stats.pendiente}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">En Proceso</p>
              <p className="text-3xl text-blue-600 mt-2">{stats.enProceso}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-300">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Resueltos</p>
              <p className="text-3xl text-green-600 mt-2">{stats.resuelto}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-2 border-green-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-green-800">Seguimiento de Reportes Públicos</CardTitle>
          <CardDescription>
            Consulta el estado de todos los reportes de la comunidad
          </CardDescription>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por título, dirección o entidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-green-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 border-green-200">
                <Filter className="w-4 h-4 mr-2" />
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p>Cargando reportes...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron reportes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow border-2 border-green-100 hover:border-green-300">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Image */}
                      {report.image && (
                        <div className="w-full sm:w-32 h-32 flex-shrink-0">
                          <img
                            src={report.image}
                            alt={report.title}
                            className="w-full h-full object-cover rounded-lg border-2 border-green-200"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-green-900">{report.title}</h3>
                          <Badge className={STATUS_CONFIG[report.status].color}>
                            {STATUS_CONFIG[report.status].label}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {report.description}
                        </p>

                        <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="truncate">{report.location || report.address}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span>{formatDate(report.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4 text-blue-600" />
                            <span>{getCommentCount(report.id)} comentarios</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500">ID: #{report.id}</span>
                            <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200">
                              {report.entityName || report.entity}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <ShareButtons
                              reportId={report.id}
                              reportTitle={report.title}
                              reportDescription={report.description}
                              reportStatus={report.status}
                              reportAddress={report.location || report.address || ''}
                              reportEntity={report.entityName || report.entity || ''}
                              reportImage={report.images?.[0] || report.image}
                              size="sm"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-200 hover:bg-green-50"
                              onClick={() => setSelectedReport(report)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              <span className="hidden sm:inline">Ver Seguimiento</span>
                              <span className="sm:hidden">Ver</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-green-200">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-green-800">{selectedReport?.title}</DialogTitle>
                <DialogDescription>Reporte #{selectedReport?.id}</DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedReport(null)}
                className="hover:bg-green-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              {/* Status */}
              <div>
                <Badge className={STATUS_CONFIG[selectedReport.status].color}>
                  {STATUS_CONFIG[selectedReport.status].label}
                </Badge>
              </div>

              {/* Image */}
              {selectedReport.image && (
                <div className="w-full">
                  <img
                    src={selectedReport.image}
                    alt={selectedReport.title}
                    className="w-full h-64 object-cover rounded-lg border-2 border-green-200"
                  />
                </div>
              )}

              <Separator />

              {/* Details */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm text-gray-500 mb-1">Descripción</h4>
                  <p>{selectedReport.description}</p>
                </div>

                <div>
                  <h4 className="text-sm text-gray-500 mb-1">Entidad Responsable</h4>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {selectedReport.entityName || selectedReport.entity}
                  </Badge>
                  {selectedReport.manuallyAssigned && (
                    <p className="text-xs text-gray-500 mt-1">Asignada manualmente por el usuario</p>
                  )}
                </div>

                {selectedReport.aiClassification && (
                  <div className="bg-gradient-to-r from-yellow-50 to-green-50 border-2 border-yellow-200 rounded-lg p-3">
                    <h4 className="text-sm text-green-800 mb-2">Clasificación Automática por IA</h4>
                    <p className="text-xs text-gray-600 mb-1">
                      Confianza: {selectedReport.aiClassification.confidence}%
                    </p>
                    <p className="text-xs text-gray-600">
                      {selectedReport.aiClassification.reasoning}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm text-gray-500 mb-1">Ubicación</h4>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    {selectedReport.location || selectedReport.address}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm text-gray-500 mb-1">Reportado por</h4>
                  <p>{selectedReport.userName}</p>
                </div>

                <div>
                  <h4 className="text-sm text-gray-500 mb-1">Fecha de Creación</h4>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    {formatDate(selectedReport.createdAt)}
                  </p>
                </div>

                {selectedReport.rating && (
                  <div>
                    <h4 className="text-sm text-gray-500 mb-1">Calificación del Ciudadano</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-lg ${i < selectedReport.rating! ? 'text-yellow-500' : 'text-gray-300'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({selectedReport.rating}/5)</span>
                    </div>
                    {selectedReport.ratingComment && (
                      <p className="text-sm text-gray-600 mt-1 italic">\"{selectedReport.ratingComment}\"</p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Timeline */}
              <div>
                <h4 className="mb-3 text-green-800">Historial de Estado</h4>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div>
                      <p className="text-sm">Reporte creado</p>
                      <p className="text-xs text-gray-500">{formatDate(selectedReport.createdAt)}</p>
                    </div>
                  </div>
                  {selectedReport.status !== 'pendiente' && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div>
                        <p className="text-sm">En proceso de atención</p>
                        <p className="text-xs text-gray-500">Por {selectedReport.entityName || selectedReport.entity}</p>
                      </div>
                    </div>
                  )}
                  {selectedReport.status === 'resuelto' && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                      <div>
                        <p className="text-sm">Reporte resuelto</p>
                        <p className="text-xs text-gray-500">Problema solucionado exitosamente</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex justify-between items-center flex-wrap gap-3">
                <ShareButtons
                  reportId={selectedReport.id}
                  reportTitle={selectedReport.title}
                  reportDescription={selectedReport.description}
                  reportStatus={selectedReport.status}
                  reportAddress={selectedReport.location || selectedReport.address || ''}
                  reportEntity={selectedReport.entityName || selectedReport.entity || ''}
                  reportImage={selectedReport.images?.[0] || selectedReport.image}
                  size="lg"
                />
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setSelectedReport(null)}
                  className="border-green-200 hover:bg-green-50"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
