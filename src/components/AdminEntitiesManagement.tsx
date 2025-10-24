import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Building2, Plus, Search, Trash2, Edit, X, Save, Phone as PhoneIcon, Globe, Mail as MailIcon } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
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

const CATEGORIES = [
  'Infraestructura',
  'Servicios Públicos',
  'Aseo y Limpieza',
  'Salud',
  'Seguridad',
  'Emergencias',
  'Gobierno',
  'Otros',
];

export function AdminEntitiesManagement() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [deleteEntityId, setDeleteEntityId] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Infraestructura',
    email: '',
    phone: '',
    website: '',
  });

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = () => {
    const storedEntities = JSON.parse(localStorage.getItem('entities') || '[]');
    
    // Initialize with default entities if empty
    if (storedEntities.length === 0) {
      const defaultEntities: Entity[] = [
        {
          id: '1',
          name: 'Alcaldía - Infraestructura',
          description: 'Encargada de vías, puentes y obras públicas',
          category: 'Infraestructura',
          email: 'infraestructura@buenaventura.gov.co',
          phone: '(2) 242-3456',
          website: 'https://www.buenaventura.gov.co',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Alcaldía - Servicios Públicos',
          description: 'Gestión de servicios públicos domiciliarios',
          category: 'Servicios Públicos',
          email: 'servicios@buenaventura.gov.co',
          phone: '(2) 242-3457',
          website: 'https://www.buenaventura.gov.co',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Alcaldía - Aseo',
          description: 'Recolección de basuras y limpieza urbana',
          category: 'Aseo y Limpieza',
          email: 'aseo@buenaventura.gov.co',
          phone: '(2) 242-3458',
          website: 'https://www.buenaventura.gov.co',
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          name: 'Empresa de Acueducto',
          description: 'Suministro y mantenimiento de agua potable',
          category: 'Servicios Públicos',
          email: 'servicio@acueducto-buenaventura.com',
          phone: '(2) 242-5678',
          website: 'https://acueducto-buenaventura.com',
          createdAt: new Date().toISOString(),
        },
        {
          id: '5',
          name: 'Policía',
          description: 'Seguridad ciudadana y orden público',
          category: 'Seguridad',
          email: 'buenaventura@policia.gov.co',
          phone: '123',
          createdAt: new Date().toISOString(),
        },
        {
          id: '6',
          name: 'Bomberos',
          description: 'Atención de emergencias e incendios',
          category: 'Emergencias',
          email: 'bomberos@buenaventura.gov.co',
          phone: '119',
          createdAt: new Date().toISOString(),
        },
        {
          id: '7',
          name: 'Hospital',
          description: 'Servicios de salud pública',
          category: 'Salud',
          email: 'urgencias@hospital-buenaventura.gov.co',
          phone: '(2) 242-7890',
          website: 'https://hospital-buenaventura.gov.co',
          createdAt: new Date().toISOString(),
        },
        {
          id: '8',
          name: 'Alcaldía General',
          description: 'Oficina principal de la alcaldía',
          category: 'Gobierno',
          email: 'alcaldia@buenaventura.gov.co',
          phone: '(2) 242-0000',
          website: 'https://www.buenaventura.gov.co',
          createdAt: new Date().toISOString(),
        },
      ];
      
      localStorage.setItem('entities', JSON.stringify(defaultEntities));
      setEntities(defaultEntities);
    } else {
      const sortedEntities = storedEntities.sort((a: Entity, b: Entity) => 
        a.name.localeCompare(b.name)
      );
      setEntities(sortedEntities);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Infraestructura',
      email: '',
      phone: '',
      website: '',
    });
    setCustomCategory('');
    setShowCustomCategory(false);
  };

  const handleAdd = () => {
    if (!formData.name.trim()) {
      toast.error('El nombre de la entidad es obligatorio');
      return;
    }

    // Usar categoría personalizada si está seleccionada
    const finalCategory = showCustomCategory && customCategory.trim() 
      ? customCategory.trim() 
      : formData.category;

    const newEntity: Entity = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: finalCategory,
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      website: formData.website.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedEntities = [...entities, newEntity];
    localStorage.setItem('entities', JSON.stringify(updatedEntities));
    setEntities(updatedEntities);
    setShowAddDialog(false);
    resetForm();
    toast.success('Entidad agregada exitosamente');
  };

  const handleEdit = () => {
    if (!editingEntity) return;
    
    if (!formData.name.trim()) {
      toast.error('El nombre de la entidad es obligatorio');
      return;
    }

    // Usar categoría personalizada si está seleccionada
    const finalCategory = showCustomCategory && customCategory.trim() 
      ? customCategory.trim() 
      : formData.category;

    const updatedEntities = entities.map(e =>
      e.id === editingEntity.id
        ? {
            ...e,
            name: formData.name.trim(),
            description: formData.description.trim(),
            category: finalCategory,
            email: formData.email.trim() || undefined,
            phone: formData.phone.trim() || undefined,
            website: formData.website.trim() || undefined,
          }
        : e
    );

    localStorage.setItem('entities', JSON.stringify(updatedEntities));
    setEntities(updatedEntities);
    setEditingEntity(null);
    resetForm();
    toast.success('Entidad actualizada exitosamente');
  };

  const handleDelete = () => {
    if (!deleteEntityId) return;

    // Check if entity has reports assigned
    const reports = JSON.parse(localStorage.getItem('reports') || '[]');
    const entityToDelete = entities.find(e => e.id === deleteEntityId);
    const hasReports = reports.some((r: any) => r.entity === entityToDelete?.name);

    if (hasReports) {
      toast.error('No se puede eliminar una entidad con reportes asignados');
      setDeleteEntityId(null);
      return;
    }

    const updatedEntities = entities.filter(e => e.id !== deleteEntityId);
    localStorage.setItem('entities', JSON.stringify(updatedEntities));
    setEntities(updatedEntities);
    setDeleteEntityId(null);
    toast.success('Entidad eliminada exitosamente');
  };

  const openEditDialog = (entity: Entity) => {
    setEditingEntity(entity);
    const isCustomCategory = !CATEGORIES.includes(entity.category);
    setShowCustomCategory(isCustomCategory);
    if (isCustomCategory) {
      setCustomCategory(entity.category);
    }
    setFormData({
      name: entity.name,
      description: entity.description,
      category: isCustomCategory ? 'custom' : entity.category,
      email: entity.email || '',
      phone: entity.phone || '',
      website: entity.website || '',
    });
  };

  const closeEditDialog = () => {
    setEditingEntity(null);
    resetForm();
  };

  const filteredEntities = entities.filter(entity =>
    entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get reports count for each entity
  const getReportsCount = (entityName: string) => {
    const reports = JSON.parse(localStorage.getItem('reports') || '[]');
    return reports.filter((r: any) => r.entity === entityName).length;
  };

  const categoryColors: Record<string, string> = {
    'Infraestructura': 'bg-orange-100 text-orange-800',
    'Servicios Públicos': 'bg-blue-100 text-blue-800',
    'Aseo y Limpieza': 'bg-green-100 text-green-800',
    'Salud': 'bg-red-100 text-red-800',
    'Seguridad': 'bg-purple-100 text-purple-800',
    'Emergencias': 'bg-yellow-100 text-yellow-800',
    'Gobierno': 'bg-indigo-100 text-indigo-800',
    'Otros': 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2 border-green-200 shadow-lg bg-gradient-to-r from-green-50 to-yellow-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-yellow-400 p-3 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-green-800">Gestión de Entidades</CardTitle>
                <CardDescription>
                  Administra las entidades responsables de atender reportes
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-600 hover:to-yellow-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Entidad
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-green-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Entidades</p>
                <p className="text-3xl text-green-800 mt-1">{entities.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-yellow-400 p-3 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {CATEGORIES.slice(0, 3).map((category, index) => {
          const count = entities.filter(e => e.category === category).length;
          const colors = ['from-blue-500 to-blue-600', 'from-orange-500 to-orange-600', 'from-purple-500 to-purple-600'];
          return (
            <Card key={category} className="border-2 border-green-200 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{category}</p>
                    <p className="text-3xl text-green-800 mt-1">{count}</p>
                  </div>
                  <div className={`bg-gradient-to-br ${colors[index]} p-3 rounded-lg`}>
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <Card className="border-2 border-green-200">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar entidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-green-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Entities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntities.length === 0 ? (
          <Card className="col-span-full border-2 border-green-200">
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No se encontraron entidades</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredEntities.map((entity) => (
            <Card key={entity.id} className="border-2 border-green-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-green-800">{entity.name}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={categoryColors[entity.category] || categoryColors['Otros']}>
                        {entity.category}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {getReportsCount(entity.name)} reportes
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">{entity.description}</p>
                <div className="space-y-2 mb-4">
                  {entity.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MailIcon className="w-4 h-4 text-green-600" />
                      <a href={`mailto:${entity.email}`} className="text-green-600 hover:underline">
                        {entity.email}
                      </a>
                    </div>
                  )}
                  {entity.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <PhoneIcon className="w-4 h-4 text-green-600" />
                      <span>{entity.phone}</span>
                    </div>
                  )}
                  {entity.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-green-600" />
                      <a 
                        href={entity.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-green-600 hover:underline truncate"
                      >
                        {entity.website}
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(entity)}
                    className="flex-1 border-green-200 hover:bg-green-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteEntityId(entity.id)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Entity Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="border-2 border-green-200 max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-green-800">Agregar Nueva Entidad</DialogTitle>
                <DialogDescription>
                  Completa la información de la nueva entidad
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setShowAddDialog(false); resetForm(); }}
                className="hover:bg-green-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre de la Entidad *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Alcaldía - Infraestructura"
                className="border-green-200"
              />
            </div>
            <div>
              <Label htmlFor="category">Categoría *</Label>
              <select
                id="category"
                value={showCustomCategory ? 'custom' : formData.category}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setShowCustomCategory(true);
                  } else {
                    setShowCustomCategory(false);
                    setFormData({ ...formData, category: e.target.value });
                  }
                }}
                className="w-full border-2 border-green-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="custom">+ Nueva Categoría</option>
              </select>
            </div>
            {showCustomCategory && (
              <div>
                <Label htmlFor="customCategory">Nueva Categoría *</Label>
                <Input
                  id="customCategory"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Ingresa el nombre de la nueva categoría"
                  className="border-green-200"
                />
              </div>
            )}
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe las funciones de esta entidad..."
                className="border-green-200"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ejemplo@buenaventura.gov.co"
                className="border-green-200"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ej: 123 o (2) 242-3456"
                  className="border-green-200"
                />
              </div>
              <div>
                <Label htmlFor="website">Sitio Web (opcional)</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://ejemplo.gov.co"
                  className="border-green-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => { setShowAddDialog(false); resetForm(); }}
                className="border-green-200 hover:bg-green-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAdd}
                className="bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-600 hover:to-yellow-500"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Entidad
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Entity Dialog */}
      <Dialog open={!!editingEntity} onOpenChange={closeEditDialog}>
        <DialogContent className="border-2 border-green-200 max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-green-800">Editar Entidad</DialogTitle>
                <DialogDescription>
                  Actualiza la información de la entidad
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeEditDialog}
                className="hover:bg-green-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre de la Entidad *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Alcaldía - Infraestructura"
                className="border-green-200"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Categoría *</Label>
              <select
                id="edit-category"
                value={showCustomCategory ? 'custom' : formData.category}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setShowCustomCategory(true);
                  } else {
                    setShowCustomCategory(false);
                    setFormData({ ...formData, category: e.target.value });
                  }
                }}
                className="w-full border-2 border-green-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="custom">+ Nueva Categoría</option>
              </select>
            </div>
            {showCustomCategory && (
              <div>
                <Label htmlFor="edit-customCategory">Nueva Categoría *</Label>
                <Input
                  id="edit-customCategory"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Ingresa el nombre de la nueva categoría"
                  className="border-green-200"
                />
              </div>
            )}
            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe las funciones de esta entidad..."
                className="border-green-200"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email (opcional)</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ejemplo@buenaventura.gov.co"
                className="border-green-200"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Teléfono (opcional)</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ej: 123 o (2) 242-3456"
                  className="border-green-200"
                />
              </div>
              <div>
                <Label htmlFor="edit-website">Sitio Web (opcional)</Label>
                <Input
                  id="edit-website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://ejemplo.gov.co"
                  className="border-green-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={closeEditDialog}
                className="border-green-200 hover:bg-green-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEdit}
                className="bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-600 hover:to-yellow-500"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteEntityId} onOpenChange={() => setDeleteEntityId(null)}>
        <AlertDialogContent className="border-2 border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-800">¿Eliminar entidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Solo puedes eliminar entidades que no tengan reportes asignados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-green-200 hover:bg-green-50">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
