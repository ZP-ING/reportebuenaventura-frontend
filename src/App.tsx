import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ReportForm } from './components/ReportForm';
import { ReportsList } from './components/ReportsList';
import { EntityList } from './components/EntityList';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAnalytics } from './components/AdminAnalytics';
import { AdminReportsManagement } from './components/AdminReportsManagement';
import { AdminUsersManagement } from './components/AdminUsersManagement';
import { AdminEntitiesManagement } from './components/AdminEntitiesManagement';
import { PublicReportsTracking } from './components/PublicReportsTracking';
import { MyReports } from './components/MyReports';
import { LoginPage } from './components/LoginPage';
import { ResetPassword } from './components/ResetPassword';
import { Button } from './components/ui/button';
import { MapPin, FileText, Building2, LayoutDashboard, LogOut, User, Mail, Phone, Search, ArrowLeft, UserCircle, BarChart3, Settings, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Toaster } from './components/ui/sonner';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'ciudadano';
}

export default function App() {
  const [activeTab, setActiveTab] = useState('mis-reportes');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check if we're on the reset password page
  const isResetPasswordPage = window.location.hash === '#access_token' || window.location.pathname === '/reset-password';

  useEffect(() => {
    // Check if user is logged in (still using localStorage for session)
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      // Set default tab based on role
      if (user.role === 'admin') {
        setActiveTab('analytics');
      } else {
        setActiveTab('mis-reportes');
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    // Set initial tab based on role
    if (user.role === 'admin') {
      setActiveTab('analytics');
    } else {
      setActiveTab('mis-reportes');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setActiveTab('mis-reportes');
  };

  // If on reset password page, show reset password component
  if (isResetPasswordPage) {
    return <ResetPassword />;
  }

  // If not logged in, show login page
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-yellow-50 to-lime-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-gradient sticky top-0 z-50" style={{
        borderImage: 'linear-gradient(90deg, #10b981, #fbbf24, #84cc16) 1'
      }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-yellow-400 p-3 rounded-xl shadow-lg">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-green-600 via-yellow-500 to-lime-600 bg-clip-text text-transparent">
                  ReporteBuenaventura
                </h1>
                <p className="text-sm text-gray-600">Plataforma Ciudadana de Reportes</p>
              </div>
            </div>

            {/* User Menu and Logout */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-green-50 px-3 py-2 rounded-md transition-colors outline-none focus:ring-2 focus:ring-green-400">
                  <Avatar className="w-8 h-8 border-2 border-green-400">
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-yellow-400 text-white">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm text-green-900">{currentUser.name}</p>
                    <p className="text-xs text-yellow-600">
                      {isAdmin ? 'Administrador' : 'Ciudadano'}
                    </p>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-green-800">Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <User className="w-4 h-4 mr-2" />
                    <span className="truncate">{currentUser.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Logout Button - Visible on larger screens */}
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="hidden md:flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tabs for Citizens */}
          {!isAdmin && (
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-white border-2 border-green-200">
              <TabsTrigger 
                value="mis-reportes" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-yellow-400 data-[state=active]:text-white"
              >
                <UserCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Mis Reportes</span>
                <span className="sm:hidden">Míos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reportar" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-yellow-400 data-[state=active]:text-white"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Crear Reporte</span>
                <span className="sm:hidden">Crear</span>
              </TabsTrigger>
              <TabsTrigger 
                value="seguimiento" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-yellow-400 data-[state=active]:text-white"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Seguir Reporte</span>
                <span className="sm:hidden">Seguir</span>
              </TabsTrigger>
              <TabsTrigger 
                value="entidades" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-yellow-400 data-[state=active]:text-white"
              >
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Entidades</span>
                <span className="sm:hidden">Entidades</span>
              </TabsTrigger>
            </TabsList>
          )}

          {/* Tabs for Admin */}
          {isAdmin && (
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-8 bg-white border-2 border-green-200">
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-yellow-400 data-[state=active]:text-white"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Análisis</span>
                <span className="sm:hidden">Análisis</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reports-management" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-yellow-400 data-[state=active]:text-white"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Reportes</span>
                <span className="sm:hidden">Reportes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users-management" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-yellow-400 data-[state=active]:text-white"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Usuarios</span>
                <span className="sm:hidden">Usuarios</span>
              </TabsTrigger>
              <TabsTrigger 
                value="entities" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-yellow-400 data-[state=active]:text-white"
              >
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Entidades</span>
                <span className="sm:hidden">Entidades</span>
              </TabsTrigger>
              <TabsTrigger 
                value="entities-management" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-yellow-400 data-[state=active]:text-white"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Gestión</span>
                <span className="sm:hidden">Gestión</span>
              </TabsTrigger>
            </TabsList>
          )}

          {/* Citizen Tabs Content */}
          {!isAdmin && (
            <>
              <TabsContent value="mis-reportes">
                <MyReports currentUser={currentUser} />
              </TabsContent>

              <TabsContent value="reportar">
                <ReportForm currentUser={currentUser} />
              </TabsContent>

              <TabsContent value="seguimiento">
                <PublicReportsTracking />
              </TabsContent>

              <TabsContent value="entidades">
                <EntityList />
              </TabsContent>
            </>
          )}

          {/* Admin Tabs Content */}
          {isAdmin && (
            <>
              <TabsContent value="analytics">
                <AdminAnalytics />
              </TabsContent>

              <TabsContent value="reports-management">
                <AdminReportsManagement />
              </TabsContent>

              <TabsContent value="users-management">
                <AdminUsersManagement />
              </TabsContent>

              <TabsContent value="entities">
                <EntityList />
              </TabsContent>

              <TabsContent value="entities-management">
                <AdminEntitiesManagement />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      {/* Footer - Always at bottom */}
      <footer className="bg-white border-t-4 mt-auto" style={{
        borderImage: 'linear-gradient(90deg, #10b981, #fbbf24, #84cc16) 1'
      }}>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Derechos de Autor */}
            <div>
              <h4 className="text-green-800 mb-3">Derechos de Autor</h4>
              <p className="text-sm text-gray-600">
                © 2025 ZPservicioTecnico
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Todos los derechos reservados
              </p>
            </div>

            {/* Información */}
            <div>
              <h4 className="text-green-800 mb-3">Información</h4>
              <p className="text-sm text-gray-600">
                ReporteBuenaventura es una plataforma ciudadana para reportar y dar seguimiento a problemas urbanos en Buenaventura.
              </p>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-green-800 mb-3">Contacto</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <a 
                    href="mailto:johnvalenciazp@gmail.com" 
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="break-all">johnvalenciazp@gmail.com</span>
                  </a>
                  <a 
                    href="mailto:jhon.william.angulo@correounivalle.edu.co" 
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors mt-1"
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="break-all">jhon.william.angulo@correounivalle.edu.co</span>
                  </a>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">WhatsApp</p>
                  <a 
                    href="https://wa.me/573106507940" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    +57 3106507940
                  </a>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                  <a 
                    href="tel:+573106507940" 
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    +57 3106507940
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-green-200 text-center">
            <p className="text-sm text-gray-500">
              Desarrollado con un ❤️ para Buenaventura
            </p>
          </div>
        </div>
      </footer>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}
