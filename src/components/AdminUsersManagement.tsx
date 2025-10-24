import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Users, Search, Trash2, Shield, User, Mail, Calendar, Ban, Unlock, Plus, X, Save } from 'lucide-react';
import { adminAPI, reportsAPI } from '../utils/api';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner@2.0.3';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'ciudadano';
  createdAt: string;
  blocked?: boolean;
}

export function AdminUsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [blockUserId, setBlockUserId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ciudadano' as 'admin' | 'ciudadano',
  });

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

      const response = await adminAPI.getUsers(token);
      // Sort by most recent first
      const sortedUsers = response.users.sort((a: User, b: User) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setUsers(sortedUsers);

      // Load report counts for each user
      const allReports = await reportsAPI.getAll();
      const counts: Record<string, number> = {};
      sortedUsers.forEach((user: User) => {
        counts[user.id] = allReports.reports.filter((r: any) => r.userId === user.id).length;
      });
      setReportCounts(counts);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Delete user - Note: This functionality might require additional API support
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    
    // Get current user to prevent self-deletion
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.id === deleteUserId) {
      toast.error('No puedes eliminar tu propia cuenta');
      setDeleteUserId(null);
      return;
    }
    
    toast.info('La eliminación de usuarios requiere configuración adicional en Supabase');
    setDeleteUserId(null);
    
    // Note: Actual user deletion would require additional API endpoints
    // and proper Supabase Auth configuration
  };

  // Block/Unblock user
  const handleToggleBlock = async (userId: string) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.id === userId) {
      toast.error('No puedes bloquear tu propia cuenta');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No estás autenticado');
        return;
      }

      const user = users.find(u => u.id === userId);
      if (!user) return;

      const newBlockedStatus = !user.blocked;
      await adminAPI.updateUser(userId, { blocked: newBlockedStatus }, token);

      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          return { ...u, blocked: newBlockedStatus };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      
      if (newBlockedStatus) {
        toast.success(`Usuario ${user.name} bloqueado. No podrá realizar acciones en la plataforma.`);
      } else {
        toast.success(`Usuario ${user.name} desbloqueado. Puede usar la plataforma normalmente.`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error al actualizar el usuario');
    }
  };

  // Add new user
  const handleAddUser = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    toast.info('La creación de usuarios requiere configuración adicional. Por favor usa el registro normal de la aplicación.');
    setShowAddDialog(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'ciudadano',
    });
    
    // Note: Actual user creation would require calling the signup API
    // and possibly additional configuration for admin-created users
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  // Get reports count per user
  const getReportsCount = (userId: string) => {
    return reportCounts[userId] || 0;
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    citizens: users.filter(u => u.role === 'ciudadano').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2 border-green-200 shadow-lg bg-gradient-to-r from-green-50 to-yellow-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-yellow-400 p-3 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-green-800">Gestión de Usuarios</CardTitle>
                <CardDescription>
                  Administra los usuarios registrados en la plataforma
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-600 hover:to-yellow-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Usuario
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-2 border-green-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Usuarios</p>
                <p className="text-3xl text-green-800 mt-1">{stats.total}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-yellow-400 p-3 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Administradores</p>
                <p className="text-3xl text-purple-600 mt-1">{stats.admins}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ciudadanos</p>
                <p className="text-3xl text-blue-600 mt-1">{stats.citizens}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-2 border-green-200">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar usuarios por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-green-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-2 border-green-200">
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p>Cargando usuarios...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Reportes</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-yellow-400 flex items-center justify-center text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.role === 'admin' ? (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Administrador
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">
                            <User className="w-3 h-3 mr-1" />
                            Ciudadano
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.blocked ? (
                          <Badge className="bg-red-100 text-red-800">
                            <Ban className="w-3 h-3 mr-1" />
                            Bloqueado
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            <Unlock className="w-3 h-3 mr-1" />
                            Activo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {getReportsCount(user.id)} reportes
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleBlock(user.id)}
                            className={user.blocked 
                              ? "border-green-200 text-green-600 hover:bg-green-50" 
                              : "border-orange-200 text-orange-600 hover:bg-orange-50"
                            }
                            title={user.blocked ? "Desbloquear usuario" : "Bloquear usuario"}
                          >
                            {user.blocked ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteUserId(user.id)}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="border-2 border-green-200">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-green-800">Agregar Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Completa la información del nuevo usuario
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { 
                  setShowAddDialog(false); 
                  setFormData({ name: '', email: '', password: '', role: 'ciudadano' });
                }}
                className="hover:bg-green-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="border-green-200"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ejemplo@correo.com"
                className="border-green-200"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="border-green-200"
              />
            </div>
            <div>
              <Label htmlFor="role">Rol *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: 'admin' | 'ciudadano') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="border-green-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ciudadano">Ciudadano</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => { 
                  setShowAddDialog(false); 
                  setFormData({ name: '', email: '', password: '', role: 'ciudadano' });
                }}
                className="border-green-200 hover:bg-green-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddUser}
                className="bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-600 hover:to-yellow-500"
              >
                <Save className="w-4 h-4 mr-2" />
                Crear Usuario
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent className="border-2 border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-800">¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario y todos sus reportes serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-green-200 hover:bg-green-50">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
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
