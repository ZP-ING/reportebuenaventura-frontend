import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Building2, Mail, Phone, MapPin, ExternalLink, MessageCircle } from 'lucide-react';
import { entitiesAPI, reportsAPI } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface Entity {
  id: string;
  name: string;
  description: string;
  category: string;
  email?: string;
  phone?: string;
  website?: string;
  createdAt: string;
}

const categoryColors: Record<string, string> = {
  'Infraestructura': 'bg-yellow-400 text-gray-900',
  'Servicios Públicos': 'bg-yellow-400 text-gray-900',
  'Aseo y Limpieza': 'bg-yellow-400 text-gray-900',
  'Salud': 'bg-yellow-400 text-gray-900',
  'Seguridad': 'bg-yellow-400 text-gray-900',
  'Emergencias': 'bg-red-500 text-white',
  'Gobierno': 'bg-yellow-400 text-gray-900',
  'Otros': 'bg-yellow-400 text-gray-900',
};

const getCategoryBadges = (category: string): string[] => {
  const badges: Record<string, string[]> = {
    'Infraestructura': ['Vías', 'Infraestructura', 'Construcción'],
    'Servicios Públicos': ['Alumbrado público', 'Parques', 'Espacios Públicos'],
    'Aseo y Limpieza': ['Aseo', 'Recolección', 'Limpieza'],
    'Salud': ['Programas Salud', 'Urgencias', 'Salud'],
    'Seguridad': ['Seguridad', 'Orden Público', 'CAI'],
    'Emergencias': ['Emergencias', 'Rescate', 'Incendios'],
    'Gobierno': ['Gobierno', 'Alcaldía', 'Gestión Pública'],
    'Otros': ['Otros', 'General'],
  };
  return badges[category] || ['General'];
};

export function EntityList() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadEntities();
    loadCurrentUser();
  }, []);

  const loadEntities = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('accessToken');
      const [entitiesResponse, reportsResponse] = await Promise.all([
        entitiesAPI.getAll(),
        token ? reportsAPI.getAll() : Promise.resolve({ reports: [] })
      ]);

      console.log('Entities loaded:', entitiesResponse);

      if (!entitiesResponse.entities || entitiesResponse.entities.length === 0) {
        console.warn('No entities found in response');
        setEntities([]);
        setReportCounts({});
        return;
      }

      const sortedEntities = entitiesResponse.entities.sort((a: Entity, b: Entity) => 
        a.name.localeCompare(b.name)
      );
      setEntities(sortedEntities);

      // Calculate report counts for each entity
      const counts: Record<string, number> = {};
      sortedEntities.forEach((entity: Entity) => {
        counts[entity.name] = reportsResponse.reports.filter((r: any) => r.entityName === entity.name).length;
      });
      setReportCounts(counts);
    } catch (error) {
      console.error('Error loading entities:', error);
      toast.error('Error al cargar las entidades. Verifica que las entidades estén insertadas en la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = () => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  };

  // Get reports count for each entity
  const getReportsCount = (entityName: string) => {
    return reportCounts[entityName] || 0;
  };

  // Create Gmail compose URL
  const createGmailUrl = (toEmail: string, entityName: string) => {
    const subject = encodeURIComponent(`Consulta sobre servicios - ${entityName}`);
    const body = encodeURIComponent(`Hola,\n\nMe gustaría obtener información sobre...\n\nSaludos,\n${currentUser?.name || ''}`);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${toEmail}&su=${subject}&body=${body}`;
  };

  // Create WhatsApp URL
  const createWhatsAppUrl = (phone: string, entityName: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hola, me comunico desde ReporteBuenaventura. Tengo una consulta sobre los servicios de ${entityName}.`);
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2 border-green-200 shadow-lg bg-gradient-to-r from-green-50 to-yellow-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-yellow-400 p-3 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-green-800">Entidades de Atención en Buenaventura</CardTitle>
              <CardDescription>
                Directorio de entidades públicas para contacto directo según tu necesidad
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Entities Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando entidades...</p>
        </div>
      ) : entities.length === 0 ? (
        <Card className="border-2 border-green-200">
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="mb-2">No hay entidades registradas en la base de datos</p>
              <p className="text-sm mt-2">
                Por favor, ejecuta el script SQL:
              </p>
              <code className="text-xs bg-gray-100 px-3 py-1 rounded mt-2 block max-w-md mx-auto">
                /supabase/migrations/006_insert_default_entities.sql
              </code>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entities.map((entity) => (
            <Card 
              key={entity.id} 
              className="border-2 border-green-200 hover:shadow-xl transition-shadow bg-white"
            >
              <CardHeader className="border-b border-green-100 bg-gradient-to-r from-green-50 to-yellow-50">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-br from-green-500 to-yellow-400 p-3 rounded-xl flex-shrink-0">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl text-green-900 mb-2">{entity.name}</CardTitle>
                    <p className="text-sm text-gray-600 mb-3">{entity.description}</p>
                    
                    {/* Category Badges */}
                    <div className="flex flex-wrap gap-2">
                      {getCategoryBadges(entity.category).map((badge, idx) => (
                        <Badge 
                          key={idx}
                          className={idx === 0 && entity.category === 'Emergencias' 
                            ? 'bg-red-500 text-white' 
                            : 'bg-yellow-400 text-gray-900'
                          }
                        >
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-4">
                {/* Contact Information */}
                <div className="space-y-3">
                  {/* Email */}
                  {entity.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <a 
                        href={`mailto:${entity.email}`}
                        className="text-sm text-gray-700 hover:text-green-600 transition-colors"
                      >
                        {entity.email}
                      </a>
                    </div>
                  )}

                  {/* Phone */}
                  {entity.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{entity.phone}</span>
                    </div>
                  )}

                  {/* Address - mock data for visual consistency */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">
                      {entity.category === 'Emergencias' 
                        ? 'Carrera 3 # 2-30, Centro' 
                        : entity.category === 'Seguridad'
                        ? 'Calle 5 # 4-12, Centro'
                        : entity.category === 'Salud'
                        ? 'Calle # 10, Nayita Norte'
                        : 'Calle 1 # 1A-08, Centro'
                      }
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4">
                  {/* Phone Actions */}
                  {entity.phone && (
                    <div className="flex gap-2">
                      <Button
                      onClick={() => window.location.href = `tel:${entity.phone.replace(/[^\d]/g, '')}`}
                      className="flex-1 bg-gradient-to-r from-lime-400 via-yellow-400 to-lime-400 hover:from-lime-500 hover:via-yellow-500 hover:to-lime-500 text-gray-900 shadow-md"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Llamar
                    </Button>
                    <Button
                      onClick={() => window.open(createWhatsAppUrl(entity.phone, entity.name), '_blank', 'noopener,noreferrer')}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                    </div>
                  )}
                  
                  {/* Email and Website */}
                  <div className="flex gap-2">
                  {entity.email && (
                    <Button
                      onClick={() => window.open(createGmailUrl(entity.email!, entity.name), '_blank', 'noopener,noreferrer')}
                      variant="outline"
                      className={`${!entity.phone ? 'flex-1' : 'flex-1'} bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50`}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  )}
                  
                  {entity.website && (
                    <Button
                      onClick={() => window.open(entity.website, '_blank', 'noopener,noreferrer')}
                      variant="outline"
                      className={`${!entity.email ? 'flex-1' : 'flex-shrink-0'} bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50`}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {!entity.email && 'Sitio Web'}
                    </Button>
                  )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
