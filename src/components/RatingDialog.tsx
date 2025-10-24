import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Star } from 'lucide-react';

interface RatingDialogProps {
  report: { id: string; title: string } | null;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => void;
}

export function RatingDialog({ report, onClose, onSubmit }: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, comment);
      setRating(0);
      setComment('');
    }
  };

  if (!report) return null;

  return (
    <Dialog open={!!report} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-2 border-green-200">
        <DialogHeader>
          <DialogTitle className="text-green-800">Califica la Atención Recibida</DialogTitle>
          <DialogDescription>
            ¿Cómo fue la resolución de tu reporte "{report.title}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-gray-600">Selecciona tu calificación</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm">
                {rating === 1 && 'Muy insatisfecho'}
                {rating === 2 && 'Insatisfecho'}
                {rating === 3 && 'Neutral'}
                {rating === 4 && 'Satisfecho'}
                {rating === 5 && 'Muy satisfecho'}
              </p>
            )}
          </div>

          {/* Optional Comment */}
          <div className="space-y-2">
            <label className="text-sm">
              Comentarios (opcional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos sobre tu experiencia..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 border-green-200 hover:bg-green-50">
              Cancelar
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
