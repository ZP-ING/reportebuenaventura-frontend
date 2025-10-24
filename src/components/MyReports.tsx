import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MapPin, Calendar, Eye, Search, Filter, X, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { RatingDialog } from './RatingDialog';
import { CommentsSection } from './CommentsSection';
import { ShareButtons } from './ShareButtons';
import { toast } from 'sonner@2.0.3';
import { reportsAPI } from '../utils/api';

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
  userEmail: string;
  createdAt: string;
  manuallyAssigned?: boolean;
  aiClassification?: {
    confidence: number;
    reasoning: string;
  };
  rating?: number;
  // Compatibilidad
  entity?: string;
  address?: string;
  image?: string;
}

interface MyReportsProps {
  currentUser: { id: string; email: string; name: string; role: 'admin' | 'ciudadano' };
}

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'en-proceso': { label: 'En Proceso', color: 'bg-blue-100 text-blue-800', icon: TrendingUp },
  resuelto: { label: 'Resuelto', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export function MyReports({ currentUser }: MyReportsProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [ratingReport, setRatingReport] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    loadReports();
    
    // Listen for storage changes to refresh when new reports are added
    const handleStorageChange = () => {
      loadReports();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-window updates
    const handleReportUpdate = () => {
      loadReports();
    };
    
    window.addEventListener('reportUpdated', handleReportUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('reportUpdated', handleReportUpdate);
    };
  }, [currentUser.id]);

  const loadReports = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('No access token found');
        return;
      }
      
      const response = await reportsAPI.getUserReports(token);
      // Ordenar por fecha más reciente
      const sortedReports = response.reports.sort((a: Report, b: Report) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReports(sortedReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Error al cargar tus reportes');
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

  const handleRatingSubmit = async (rating: number, comment?: string) => {
    if (!ratingReport) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No estás autenticado');
        return;
      }
      
      await reportsAPI.update(ratingReport.id, { rating, ratingComment: comment }, token);
      
      loadReports();
      setRatingReport(null);
      toast.success('¡Gracias por tu calificación!');
    } catch (error) {
      console.error('Error saving rating:', error);
      toast.error('Error al guardar la calificación');
    }
  };

  const stats = {
    total: reports.length,
    pendiente: reports.filter(r => r.status === 'pendiente').length,
    enProceso: reports.filter(r => r.status === 'en-proceso').length,
    resuelto: reports.filter(r => r.status === 'resuelto').length,
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
              <CardTitle className="text-green-800">Mis Reportes</CardTitle>
              <CardDescription>
                Gestiona y da seguimiento a todos tus reportes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-green-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Total de Reportes</p>
              <p className="text-3xl text-green-800 mt-2">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-yellow-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-3xl text-yellow-600 mt-2">{stats.pendiente}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">En Proceso</p>
              <p className="text-3xl text-blue-600 mt-2">{stats.enProceso}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-300 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Resueltos</p>
              <p className="text-3xl text-green-600 mt-2">{stats.resuelto}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-2 border-green-200 shadow-lg">
        <CardHeader>
          <div className="flex flex-col gap-4">
            {/* Info Alert */}
            {reports.length === 0 && (
              <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-yellow-50">
                <FileText className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>¡Bienvenido, {currentUser.name}!</strong>
                  <br />
                  Aún no has creado ningún reporte. Ve a la pestaña "Crear Reporte" para reportar tu primer problema urbano y ayudar a mejorar nuestra ciudad.
                </AlertDescription>
              </Alert>
            )}

            {/* Filters */}
            {reports.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar en mis reportes..."
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
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>
                {reports.length === 0 
                  ? 'No has creado reportes aún' 
                  : 'No se encontraron reportes con estos filtros'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => {
                const StatusIcon = STATUS_CONFIG[report.status].icon;
                return (
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
                              <StatusIcon className="w-3 h-3 mr-1" />
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
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-gray-500">ID: #{report.id}</span>
                              <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200">
                                {report.entityName || report.entity}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-200 hover:bg-green-50"
                              onClick={() => setSelectedReport(report)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
                    <p className="text-xs text-gray-500 mt-1">Asignada manualmente por ti</p>
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
                  <h4 className="text-sm text-gray-500 mb-1">Fecha de Creación</h4>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    {formatDate(selectedReport.createdAt)}
                  </p>
                </div>

                {selectedReport.rating && (
                  <div>
                    <h4 className="text-sm text-gray-500 mb-1">Calificación</h4>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < selectedReport.rating! ? 'text-yellow-500' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
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
                        <p className="text-xs text-gray-500">Por {selectedReport.entity}</p>
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
                  {selectedReport.status === 'rechazado' && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                      <div>
                        <p className="text-sm">Reporte rechazado</p>
                        <p className="text-xs text-gray-500">El reporte no pudo ser procesado</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Comments Section */}
              <CommentsSection reportId={selectedReport.id} currentUser={currentUser} />

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-between items-center">
                <div className="flex gap-2">
                  <ShareButtons
                    reportId={selectedReport.id}
                    reportTitle={selectedReport.title}
                    reportDescription={selectedReport.description}
                    reportStatus={selectedReport.status}
                    reportAddress={selectedReport.address}
                    reportEntity={selectedReport.entity}
                    reportImage={selectedReport.image}
                    size="lg"
                  />
                  {selectedReport.status === 'resuelto' && !selectedReport.rating && (
                    <Button
                      size="lg"
                      onClick={() => {
                        setRatingReport({ id: selectedReport.id, title: selectedReport.title });
                        setSelectedReport(null);
                      }}
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white"
                    >
                      <Star className="w-5 h-5 mr-2" />
                      Calificar
                    </Button>
                  )}
                </div>
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

      {/* Rating Dialog */}
      <RatingDialog
        report={ratingReport}
        onClose={() => setRatingReport(null)}
        onSubmit={handleRatingSubmit}
      />
    </div>
  );
}
