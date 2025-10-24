import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MapPin, Calendar, Eye, Search, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { RatingDialog } from './RatingDialog';
import { reportsAPI } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  location: { lat: number; lng: number };
  address: string;
  image?: string;
  status: 'pendiente' | 'en-proceso' | 'resuelto' | 'rechazado';
  entity: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number | null;
  createdAt: string;
}

interface ReportsListProps {
  currentUser: { id: string; email: string; name: string; role: 'admin' | 'ciudadano' };
  isAdmin: boolean;
}

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  'en-proceso': { label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
  resuelto: { label: 'Resuelto', color: 'bg-green-100 text-green-800' },
  rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
};

const MOCK_REPORTS: Report[] = [
  {
    id: '1001',
    title: 'Hueco profundo en vía principal',
    description: 'Hay un hueco de aproximadamente 1 metro de diámetro en la Calle 5ta que pone en riesgo a los vehículos.',
    category: 'vias',
    location: { lat: 3.8801, lng: -77.0312 },
    address: 'Calle 5ta con Carrera 10, Barrio San José',
    status: 'resuelto',
    entity: 'Alcaldía - Infraestructura',
    userId: 'user-1',
    userName: 'María González',
    userEmail: 'maria@email.com',
    rating: 5,
    createdAt: '2025-10-15T10:30:00Z',
  },
  {
    id: '1002',
    title: 'Falta de alumbrado público',
    description: 'Varias luminarias están apagadas en el parque principal, generando inseguridad en las noches.',
    category: 'alumbrado',
    location: { lat: 3.8815, lng: -77.0325 },
    address: 'Parque Principal, Centro',
    status: 'en-proceso',
    entity: 'Alcaldía - Servicios Públicos',
    userId: 'user-2',
    userName: 'Carlos Ramírez',
    userEmail: 'carlos@email.com',
    rating: null,
    createdAt: '2025-10-16T14:20:00Z',
  },
  {
    id: '1003',
    title: 'Acumulación de basura',
    description: 'No han recogido la basura en 5 días, generando malos olores y proliferación de mosquitos.',
    category: 'basura',
    location: { lat: 3.8790, lng: -77.0300 },
    address: 'Barrio La Playita, Calle 8va',
    status: 'resuelto',
    entity: 'Empresa de Aseo',
    userId: 'user-3',
    userName: 'Ana López',
    userEmail: 'ana@email.com',
    rating: 4,
    createdAt: '2025-10-10T08:15:00Z',
  },
];

export function ReportsList({ currentUser, isAdmin }: ReportsListProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [ratingReport, setRatingReport] = useState<Report | null>(null);

  const loadReports = async () => {
    try {
      const response = await reportsAPI.getAll();
      const allReports = [...response.reports, ...MOCK_REPORTS];
      
      // Filter reports based on user role
      if (isAdmin) {
        setReports(allReports);
      } else {
        // Show only user's own reports
        setReports(allReports.filter(r => r.userId === currentUser.id));
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Error al cargar reportes');
      // Fallback to mock data
      setReports(MOCK_REPORTS);
    }
  };

  useEffect(() => {
    loadReports();
  }, [currentUser.id, isAdmin]);

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleRatingSubmit = async (rating: number) => {
    if (!ratingReport) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No estás autenticado');
        return;
      }
      
      await reportsAPI.update(ratingReport.id, { rating }, token);
      toast.success('Calificación guardada exitosamente');
      
      setRatingReport(null);
      loadReports();
    } catch (error) {
      console.error('Error saving rating:', error);
      toast.error('Error al guardar calificación');
    }
  };

  const canRate = (report: Report) => {
    return (
      !isAdmin &&
      report.status === 'resuelto' &&
      report.userId === currentUser.id &&
      report.rating === null
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="border-2 border-green-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-green-800">{isAdmin ? 'Todos los Reportes' : 'Mis Reportes'}</CardTitle>
          <CardDescription>
            {isAdmin
              ? 'Vista completa de reportes del sistema'
              : 'Consulta el estado de tus reportes y su proceso de atención'}
          </CardDescription>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por título o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-green-200"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
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
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-blue-900">{report.title}</h3>
                          <Badge className={STATUS_CONFIG[report.status].color}>
                            {STATUS_CONFIG[report.status].label}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {report.description}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{report.address}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(report.createdAt)}</span>
                          </div>
                        </div>

                        {/* Rating display */}
                        {report.rating && (
                          <div className="flex items-center gap-1 mb-3">
                            <span className="text-sm text-gray-600">Calificación:</span>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < report.rating!
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-500">ID: #{report.id}</span>
                          <div className="flex gap-2">
                            {canRate(report) && (
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-600 hover:to-yellow-500 text-white"
                                onClick={() => setRatingReport(report)}
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Calificar
                              </Button>
                            )}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>Reporte #{selectedReport?.id}</DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge className={STATUS_CONFIG[selectedReport.status].color}>
                  {STATUS_CONFIG[selectedReport.status].label}
                </Badge>
                {selectedReport.rating && (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < selectedReport.rating!
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Image */}
              {selectedReport.image && (
                <div className="w-full">
                  <img
                    src={selectedReport.image}
                    alt={selectedReport.title}
                    className="w-full h-64 object-cover rounded-lg"
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
                  <p>{selectedReport.entity}</p>
                </div>

                {isAdmin && (
                  <div>
                    <h4 className="text-sm text-gray-500 mb-1">Reportado por</h4>
                    <p>{selectedReport.userName} ({selectedReport.userEmail})</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm text-gray-500 mb-1">Ubicación</h4>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedReport.address}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm text-gray-500 mb-1">Fecha de Creación</h4>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedReport.createdAt)}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm text-gray-500 mb-1">Coordenadas</h4>
                  <p className="text-sm">
                    Lat: {selectedReport.location.lat.toFixed(6)}, 
                    Lng: {selectedReport.location.lng.toFixed(6)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Timeline */}
              <div>
                <h4 className="mb-3">Historial de Estado</h4>
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
                </div>
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
