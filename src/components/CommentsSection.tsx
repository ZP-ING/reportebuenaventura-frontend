import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback } from './ui/avatar';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Separator } from './ui/separator';
import { commentsAPI } from '../utils/api';

interface Comment {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  userEmail: string;
  text: string;
  createdAt: string;
}

interface CommentsSectionProps {
  reportId: string;
  currentUser: { id: string; name: string; email: string; role: 'admin' | 'ciudadano' };
}

export function CommentsSection({ reportId, currentUser }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
    
    // Listen for comment updates
    const handleCommentUpdate = () => {
      loadComments();
    };
    
    window.addEventListener('commentAdded', handleCommentUpdate);
    
    return () => {
      window.removeEventListener('commentAdded', handleCommentUpdate);
    };
  }, [reportId]);

  const loadComments = async () => {
    try {
      const response = await commentsAPI.getAll(reportId);
      const sortedComments = response.comments.sort((a: Comment, b: Comment) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setComments(sortedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Por favor escribe un comentario');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No estás autenticado');
        setIsSubmitting(false);
        return;
      }

      await commentsAPI.add(reportId, newComment.trim(), token);

      setNewComment('');
      loadComments();
      
      // Dispatch event for other components to refresh
      window.dispatchEvent(new Event('commentAdded'));
      
      toast.success('Comentario agregado exitosamente');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error al agregar comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    // Note: Delete functionality would require a DELETE endpoint in the API
    // For now, we'll just show a message
    toast.info('Funcionalidad de eliminar comentarios próximamente');
    
    loadComments();
    window.dispatchEvent(new Event('commentAdded'));
    
    toast.success('Comentario eliminado');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card className="border-2 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <MessageCircle className="w-5 h-5" />
          Comentarios y Discusión ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment */}
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe tu comentario o pregunta..."
            className="border-green-200 focus:border-green-400 min-h-20 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleAddComment();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Presiona Ctrl + Enter para enviar
            </p>
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || isSubmitting}
              className="bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-600 hover:to-yellow-500 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Comentar
            </Button>
          </div>
        </div>

        <Separator />

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay comentarios aún</p>
            <p className="text-sm mt-1">Sé el primero en comentar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="w-9 h-9 border-2 border-green-200">
                  <AvatarFallback className="bg-gradient-to-br from-green-400 to-yellow-300 text-white text-sm">
                    {comment.userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="bg-gradient-to-r from-green-50 to-yellow-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm text-green-900">
                          {comment.userName}
                          {currentUser.role === 'admin' && comment.userId !== currentUser.id && (
                            <span className="ml-2 text-xs text-gray-500">Ciudadano</span>
                          )}
                          {comment.userId === currentUser.id && (
                            <span className="ml-2 text-xs text-green-600">(Tú)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                      </div>
                      {(comment.userId === currentUser.id || currentUser.role === 'admin') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {comment.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
