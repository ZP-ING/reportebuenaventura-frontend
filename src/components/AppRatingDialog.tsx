import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Star, Heart } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AppRatingDialogProps {
  open: boolean;
  onClose: () => void;
  userName: string;
}

export function AppRatingDialog({ open, onClose, userName }: AppRatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      // Save rating to localStorage
      const ratings = JSON.parse(localStorage.getItem('appRatings') || '[]');
      ratings.push({
        id: Date.now().toString(),
        rating,
        comment,
        userName,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('appRatings', JSON.stringify(ratings));

      toast.success('¡Gracias por tu calificación!', {
        description: rating >= 4 ? '¡Nos alegra que te guste la app! 🎉' : 'Trabajaremos para mejorar tu experiencia'
      });

      setRating(0);
      setComment('');
      onClose();
    }
  };

  const getRatingText = (stars: number) => {
    switch (stars) {
      case 1: return 'Muy insatisfecho';
      case 2: return 'Insatisfecho';
      case 3: return 'Neutral';
      case 4: return 'Satisfecho';
      case 5: return 'Muy satisfecho';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-2 border-green-200 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-green-800 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Califica tu Experiencia
          </DialogTitle>
          <DialogDescription>
            Tu opinión nos ayuda a mejorar ReporteBuenaventura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-600">¿Cómo ha sido tu experiencia con la aplicación?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-all hover:scale-125 focus:outline-none focus:ring-2 focus:ring-green-400 rounded"
                >
                  <Star
                    className={`w-12 h-12 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div className="text-center">
                <p className="text-lg text-green-800">
                  {getRatingText(rating)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {rating >= 4 ? '¡Gracias por tu apoyo! 🎉' : 'Nos esforzaremos por mejorar'}
                </p>
              </div>
            )}
          </div>

          {/* Optional Comment */}
          <div className="space-y-2">
            <label className="text-sm text-gray-700">
              Cuéntanos más (opcional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué te ha gustado? ¿Qué podríamos mejorar?"
              rows={4}
              className="border-green-200 focus:border-green-400 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 border-green-200 hover:bg-green-50"
            >
              Ahora no
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0}
              className="flex-1 bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-600 hover:to-yellow-500 text-white disabled:opacity-50"
            >
              Enviar Calificación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
