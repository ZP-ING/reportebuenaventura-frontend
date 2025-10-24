import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface NotificationManagerProps {
  currentUser: { id: string; email: string; name: string; role: 'admin' | 'ciudadano' };
}

interface NotificationData {
  reportId: string;
  reportTitle: string;
  oldStatus: string;
  newStatus: string;
  updatedAt: string;
}

export function NotificationManager({ currentUser }: NotificationManagerProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setPermission(Notification.permission);
      const enabled = localStorage.getItem(`notifications_enabled_${currentUser.id}`) === 'true';
      setNotificationsEnabled(enabled && Notification.permission === 'granted');
    }

    // Listen for report status changes
    const handleReportUpdate = (event: any) => {
      const detail = event.detail;
      if (detail && notificationsEnabled) {
        checkForUpdates();
      }
    };

    window.addEventListener('reportStatusChanged', handleReportUpdate);

    // Check for updates periodically
    const interval = setInterval(() => {
      if (notificationsEnabled) {
        checkForUpdates();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('reportStatusChanged', handleReportUpdate);
      clearInterval(interval);
    };
  }, [notificationsEnabled, currentUser.id]);

  const checkForUpdates = () => {
    const reports = JSON.parse(localStorage.getItem('reports') || '[]');
    const userReports = reports.filter((r: any) => r.userId === currentUser.id);
    const lastCheck = localStorage.getItem(`last_notification_check_${currentUser.id}`);
    const lastCheckTime = lastCheck ? new Date(lastCheck).getTime() : 0;

    userReports.forEach((report: any) => {
      const updatedAt = new Date(report.updatedAt || report.createdAt).getTime();
      if (updatedAt > lastCheckTime) {
        showNotification(report);
      }
    });

    localStorage.setItem(`last_notification_check_${currentUser.id}`, new Date().toISOString());
  };

  const showNotification = (report: any) => {
    const statusText = {
      'pendiente': 'Pendiente',
      'en-proceso': 'En Proceso',
      'resuelto': 'Resuelto',
      'rechazado': 'Rechazado'
    };

    const title = '🔔 Actualización de Reporte';
    const body = `Tu reporte "${report.title}" cambió a: ${statusText[report.status as keyof typeof statusText]}`;

    // Show browser notification
    if (notificationsEnabled && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: report.id,
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Also show toast notification
    toast.success(body, {
      description: `ID: #${report.id}`,
      duration: 5000,
    });
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Tu navegador no soporta notificaciones');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem(`notifications_enabled_${currentUser.id}`, 'true');
        localStorage.setItem(`last_notification_check_${currentUser.id}`, new Date().toISOString());
        toast.success('Notificaciones activadas');
        
        // Show test notification
        new Notification('🎉 ¡Notificaciones Activadas!', {
          body: 'Recibirás alertas cuando tus reportes sean actualizados',
          icon: '/favicon.ico',
        });
      } else {
        toast.error('Permiso denegado para notificaciones');
      }
    } catch (error) {
      toast.error('Error al solicitar permisos');
    }
  };

  const toggleNotifications = () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      localStorage.setItem(`notifications_enabled_${currentUser.id}`, 'false');
      toast.info('Notificaciones desactivadas');
    } else {
      requestNotificationPermission();
    }
  };

  if (!('Notification' in window)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 hidden md:block">
      <Card className="border-2 border-green-200 shadow-lg bg-white/95 backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm text-green-900">Notificaciones</p>
              <p className="text-xs text-gray-500">
                {notificationsEnabled ? 'Activadas' : 'Desactivadas'}
              </p>
            </div>
            <Button
              size="sm"
              variant={notificationsEnabled ? "default" : "outline"}
              onClick={toggleNotifications}
              className={notificationsEnabled 
                ? "bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-600 hover:to-yellow-500 text-white"
                : "border-green-200 hover:bg-green-50"
              }
            >
              {notificationsEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
