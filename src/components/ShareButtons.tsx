import { useState } from 'react';
import { Button } from './ui/button';
import { Share2, Facebook, Twitter, MessageCircle as WhatsAppIcon, Link as LinkIcon, Mail, Send, Instagram, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface ShareButtonsProps {
  reportId: string;
  reportTitle: string;
  reportDescription: string;
  reportStatus?: 'pendiente' | 'en-proceso' | 'resuelto' | 'rechazado';
  reportAddress?: string;
  reportEntity?: string;
  reportImage?: string;
  size?: 'sm' | 'default' | 'lg';
}

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  'en-proceso': 'En Proceso',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado',
};

export function ShareButtons({ 
  reportId, 
  reportTitle, 
  reportDescription, 
  reportStatus, 
  reportAddress, 
  reportEntity, 
  reportImage,
  size = 'default'
}: ShareButtonsProps) {
  const [open, setOpen] = useState(false);
  const shareUrl = `${window.location.origin}/?reportId=${reportId}`;
  
  // Crear texto completo con toda la información del reporte (sin emojis para evitar problemas de codificación)
  let fullShareText = `*** ${reportTitle} ***\n\n`;
  fullShareText += `Descripcion:\n${reportDescription}\n\n`;
  
  if (reportAddress) {
    fullShareText += `Ubicacion:\n${reportAddress}\n\n`;
  }
  
  if (reportStatus) {
    fullShareText += `Estado: ${STATUS_LABELS[reportStatus]}\n\n`;
  }
  
  if (reportEntity) {
    fullShareText += `Entidad Responsable: ${reportEntity}\n\n`;
  }
  
  fullShareText += `Ver reporte completo:\n${shareUrl}\n\n`;
  fullShareText += `#ReporteBuenaventura #CiudadaniaActiva`;
  
  const shareText = `${reportTitle} - ReporteBuenaventura`;

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(fullShareText)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    toast.success('Abriendo Facebook...');
    setOpen(false);
  };

  const handleMessengerShare = () => {
    const messengerUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(shareUrl)}`;
    window.open(messengerUrl, '_blank', 'width=600,height=400');
    toast.success('Abriendo Messenger...');
    setOpen(false);
  };

  const handleTwitterShare = () => {
    // Twitter tiene límite de 280 caracteres, crear versión más corta
    const twitterText = `*** ${reportTitle} ***\n\n${reportDescription.substring(0, 150)}${reportDescription.length > 150 ? '...' : ''}\n\n${reportStatus ? `Estado: ${STATUS_LABELS[reportStatus]}` : ''}\n\n${shareUrl}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    toast.success('Abriendo Twitter...');
    setOpen(false);
  };

  const handleInstagramShare = () => {
    // Instagram no permite compartir enlaces directamente desde web
    // Copiamos el texto al portapapeles y sugerimos al usuario
    navigator.clipboard.writeText(fullShareText).then(() => {
      toast.success('Texto copiado. Pégalo en Instagram Stories o Feed', {
        duration: 4000,
      });
      setOpen(false);
    }).catch(() => {
      toast.error('No se pudo copiar el texto');
    });
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullShareText)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Abriendo WhatsApp...');
    setOpen(false);
  };

  const handleEmailShare = () => {
    let emailBody = fullShareText;
    
    if (reportImage) {
      emailBody += `\n\nImagen del reporte:\n${reportImage}`;
    }
    
    const emailUrl = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = emailUrl;
    toast.success('Abriendo Gmail...');
    setOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Enlace copiado al portapapeles');
      setOpen(false);
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: reportTitle,
          text: fullShareText,
          url: shareUrl,
        });
        toast.success('Compartido exitosamente');
        setOpen(false);
      } catch (error) {
        const err = error as Error;
        if (err.name !== 'AbortError') {
          toast.error('No se pudo compartir');
        }
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className="border-green-200 hover:bg-green-50"
        >
          <Share2 className={size === 'lg' ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'} />
          Compartir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-800 flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Compartir Reporte
          </DialogTitle>
          <DialogDescription>
            Selecciona la plataforma donde deseas compartir este reporte
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 py-4">
          {/* WhatsApp */}
          <Button
            onClick={handleWhatsAppShare}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-200"
            variant="outline"
          >
            <WhatsAppIcon className="w-8 h-8" />
            <span>WhatsApp</span>
          </Button>

          {/* Facebook */}
          <Button
            onClick={handleFacebookShare}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200"
            variant="outline"
          >
            <Facebook className="w-8 h-8" />
            <span>Facebook</span>
          </Button>

          {/* Messenger */}
          <Button
            onClick={handleMessengerShare}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border-2 border-blue-200"
            variant="outline"
          >
            <Send className="w-8 h-8" />
            <span>Messenger</span>
          </Button>

          {/* Twitter */}
          <Button
            onClick={handleTwitterShare}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-600 border-2 border-sky-200"
            variant="outline"
          >
            <Twitter className="w-8 h-8" />
            <span>Twitter / X</span>
          </Button>

          {/* Instagram */}
          <Button
            onClick={handleInstagramShare}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-pink-50 hover:bg-pink-100 text-pink-600 border-2 border-pink-200"
            variant="outline"
          >
            <Instagram className="w-8 h-8" />
            <span>Instagram</span>
          </Button>

          {/* Gmail */}
          <Button
            onClick={handleEmailShare}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-200"
            variant="outline"
          >
            <Mail className="w-8 h-8" />
            <span>Gmail</span>
          </Button>

          {/* Copiar Enlace */}
          <Button
            onClick={handleCopyLink}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border-2 border-gray-200"
            variant="outline"
          >
            <LinkIcon className="w-8 h-8" />
            <span>Copiar Enlace</span>
          </Button>

          {/* Más Opciones (solo si el navegador lo soporta) */}
          {navigator.share && (
            <Button
              onClick={handleNativeShare}
              className="h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-green-50 to-yellow-50 hover:from-green-100 hover:to-yellow-100 text-green-700 border-2 border-green-200"
              variant="outline"
            >
              <Share2 className="w-8 h-8" />
              <span>Mas opciones</span>
            </Button>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
