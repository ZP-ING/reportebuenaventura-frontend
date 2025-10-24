import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MapSelector } from './MapSelector';
import { AlertCircle, CheckCircle2, Upload, Sparkles, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { classifyReportWithAI } from '../utils/aiClassifier';
import { toast } from 'sonner@2.0.3';
import { entitiesAPI, reportsAPI } from '../utils/api';

interface ReportFormProps {
  currentUser: { id: string; email: string; name: string; role: 'admin' | 'ciudadano' };
}

export function ReportForm({ currentUser }: ReportFormProps) {
  const [entities, setEntities] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: { lat: 3.8801, lng: -77.0312 },
    address: '',
    mapAddress: '', // Dirección del mapa
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [manualEntity, setManualEntity] = useState<string>('');
  const [suggestedEntity, setSuggestedEntity] = useState<{
    entity: string;
    confidence: number;
    reasoning: string;
  } | null>(null);

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    try {
      const response = await entitiesAPI.getAll();
      const entityNames = response.entities.map((e: any) => e.name);
      setEntities(entityNames);
    } catch (error) {
      console.error('Error loading entities:', error);
      toast.error('Error al cargar entidades');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutoClassify = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Por favor completa el título y descripción primero');
      return;
    }

    setClassifying(true);
    try {
      const result = await classifyReportWithAI(formData.title, formData.description);
      setSuggestedEntity(result);
      toast.success(`IA sugiere: ${result.entity} (${result.confidence}% confianza)`);
    } catch (error) {
      toast.error('Error al clasificar el reporte');
    } finally {
      setClassifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setClassifying(true);
    
    try {
      let finalEntity = manualEntity;
      let classification = null;
      const isAutoClassification = !manualEntity || manualEntity === 'auto';
      
      // Si no se seleccionó entidad manualmente o seleccionó "auto", usar IA
      if (isAutoClassification) {
        classification = await classifyReportWithAI(formData.title, formData.description);
        finalEntity = classification.entity;
      }
      
      // Usar dirección escrita o dirección del mapa
      const finalAddress = formData.address.trim() !== '' ? formData.address : formData.mapAddress;
      
      // Buscar el entityId si se seleccionó una entidad
      let entityId = null;
      if (finalEntity && finalEntity !== 'auto') {
        const entityMatch = entities.find(e => e === finalEntity);
        if (entityMatch) {
          // Necesitamos buscar el ID de la entidad
          try {
            const entitiesResponse = await entitiesAPI.getAll();
            const foundEntity = entitiesResponse.entities.find((e: any) => e.name === finalEntity);
            if (foundEntity) {
              entityId = foundEntity.id;
            }
          } catch (err) {
            console.error('Error finding entity ID:', err);
          }
        }
      }
      
      // Determinar categoría basada en la entidad o usar 'general'
      const category = classification?.entity 
        ? 'infraestructura' // Por ahora usamos categoría por defecto
        : 'general';
      
      const reportData = {
        title: formData.title,
        description: formData.description,
        category: category,
        entityId: entityId,
        entityName: finalEntity || 'Sin asignar',
        location: finalAddress,
        locationLat: formData.location.lat,
        locationLng: formData.location.lng,
        images: imagePreview ? [imagePreview] : [],
        aiClassification: classification ? {
          confidence: classification.confidence,
          reasoning: classification.reasoning
        } : undefined,
        manuallyAssigned: !isAutoClassification,
      };
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No estás autenticado');
        setClassifying(false);
        return;
      }
      
      console.log('Creating report with data:', reportData);
      await reportsAPI.create(reportData, token);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('reportUpdated'));
      
      if (classification) {
        setSuggestedEntity(classification);
      }
      
      toast.success('Reporte enviado exitosamente!');
      setSubmitted(true);
      
      setTimeout(() => {
        // Reset todo el formulario completamente
        setSubmitted(false);
        setSuggestedEntity(null);
        setManualEntity(''); // Resetear a string vacío
        setFormData({
          title: '',
          description: '',
          location: { lat: 3.8801, lng: -77.0312 },
          address: '',
          mapAddress: '',
        });
        setImagePreview('');
        setClassifying(false);
      }, 4000);
    } catch (error) {
      toast.error('Error al crear el reporte');
    } finally {
      setClassifying(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto border-2 border-green-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-green-800 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          Crear Nuevo Reporte
        </CardTitle>
        <CardDescription>
          Reporta problemas en tu comunidad. Puedes seleccionar la entidad manualmente o dejar que nuestra IA lo haga automáticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="space-y-4">
            <Alert className="bg-gradient-to-r from-green-50 to-lime-50 border-green-300">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>¡Reporte enviado exitosamente!</strong>
                <br />
                Tu reporte ha sido registrado y será atendido pronto.
              </AlertDescription>
            </Alert>
            {suggestedEntity ? (
              <div className="bg-gradient-to-r from-yellow-50 to-green-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-yellow-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-green-900 mb-1">Clasificación Automática por IA</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Entidad asignada:</strong> {suggestedEntity.entity}
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Confianza:</strong> {suggestedEntity.confidence}%
                    </p>
                    <p className="text-xs text-gray-600">
                      {suggestedEntity.reasoning}
                    </p>
                  </div>
                </div>
              </div>
            ) : manualEntity && manualEntity !== 'auto' && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-green-900 mb-1">Entidad Seleccionada Manualmente</h4>
                    <p className="text-sm text-gray-700">
                      Tu reporte ha sido enviado a: <strong>{manualEntity}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título del Reporte *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Hueco grande en la Calle 5ta"
                className="border-green-200"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción Detallada *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el problema con el mayor detalle posible..."
                rows={4}
                className="border-green-200"
                required
              />
            </div>

            {/* Entity Selection - Optional */}
            <div className="space-y-2">
              <Label htmlFor="entity">Seleccionar Entidad (Opcional)</Label>
              <Select 
                value={manualEntity || undefined} 
                onValueChange={(value) => {
                  setManualEntity(value);
                  // Limpiar sugerencia de IA cuando se selecciona manualmente
                  if (value !== 'auto' && value !== '') {
                    setSuggestedEntity(null);
                  }
                }}
              >
                <SelectTrigger className="border-green-200">
                  <SelectValue placeholder="Dejar que la IA seleccione automáticamente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      <span>Clasificación automática con IA</span>
                    </div>
                  </SelectItem>
                  {entities.map((entity) => (
                    <SelectItem key={entity} value={entity}>
                      {entity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {manualEntity && manualEntity !== 'auto' && (
                <p className="text-sm text-green-700">
                  Has seleccionado: <strong>{manualEntity}</strong>
                </p>
              )}
              {(!manualEntity || manualEntity === 'auto') && (
                <p className="text-sm text-gray-600">
                  La IA analizará tu reporte y asignará la entidad automáticamente
                </p>
              )}
            </div>

            {/* AI Classification Preview */}
            {formData.title && formData.description && (!manualEntity || manualEntity === 'auto') && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAutoClassify}
                  disabled={classifying}
                  className="border-yellow-300 hover:bg-yellow-50"
                >
                  {classifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Clasificando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Previsualizar Clasificación IA
                    </>
                  )}
                </Button>
                {suggestedEntity && (
                  <div className="text-sm text-green-700">
                    → {suggestedEntity.entity} ({suggestedEntity.confidence}%)
                  </div>
                )}
              </div>
            )}

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Adjuntar Imagen</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1 border-green-200"
                />
                <Upload className="w-5 h-5 text-gray-400" />
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-green-200"
                  />
                </div>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="address">Dirección o Ubicación (Opcional)</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ej: Calle 5ta con Carrera 10, Barrio San José"
                className="border-green-200"
              />
              <p className="text-xs text-gray-500">
                Si no escribes nada, se usará automáticamente la dirección del mapa
              </p>
            </div>

            {/* Map Selector */}
            <div className="space-y-2">
              <Label>Ubicación en el Mapa *</Label>
              <MapSelector
                location={formData.location}
                onLocationChange={(location) => setFormData({ ...formData, location })}
                onAddressChange={(address) => setFormData({ ...formData, mapAddress: address })}
              />
            </div>

            {/* Info Alert */}
            {(!manualEntity || manualEntity === 'auto') ? (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>Clasificación Automática:</strong> Nuestra IA analizará tu reporte y lo asignará automáticamente a la entidad correspondiente.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>Entidad seleccionada manualmente:</strong> Tu reporte será enviado directamente a {manualEntity}.
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <Button 
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    title: '',
                    description: '',
                    location: { lat: 3.8801, lng: -77.0312 },
                    address: '',
                    mapAddress: '',
                  });
                  setImagePreview('');
                  setManualEntity('');
                  setSuggestedEntity(null);
                  toast.info('Formulario cancelado');
                }}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                size="lg"
                disabled={classifying}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-600 hover:to-yellow-500 text-white" 
                size="lg"
                disabled={classifying}
              >
                {classifying ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Clasificando y enviando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Enviar Reporte
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
