-- ============================================
-- ReporteBuenaventura Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: profiles
-- Almacena información adicional de los usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ciudadano' CHECK (role IN ('admin', 'ciudadano')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- TABLA: entities
-- Entidades responsables de atender reportes
-- ============================================
CREATE TABLE IF NOT EXISTS public.entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  keywords TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- TABLA: reports
-- Reportes de problemas urbanos
-- ============================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_revision', 'en_proceso', 'resuelto', 'rechazado')),
  priority TEXT DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
  entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  entity_name TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,
  images TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- TABLA: comments
-- Comentarios en los reportes
-- ============================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- TABLA: ratings
-- Calificaciones de reportes resueltos
-- ============================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(report_id, user_id) -- Un usuario solo puede calificar una vez por reporte
);

-- ============================================
-- TABLA: notifications
-- Notificaciones para los usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('report_created', 'report_updated', 'comment_added', 'status_changed', 'report_resolved')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- ÍNDICES para mejorar el rendimiento
-- ============================================

-- Índices para profiles
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- Índices para entities
CREATE INDEX IF NOT EXISTS entities_name_idx ON public.entities(name);
CREATE INDEX IF NOT EXISTS entities_category_idx ON public.entities(category);
CREATE INDEX IF NOT EXISTS entities_active_idx ON public.entities(is_active);

-- Índices para reports
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS reports_entity_id_idx ON public.reports(entity_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
CREATE INDEX IF NOT EXISTS reports_category_idx ON public.reports(category);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS reports_is_public_idx ON public.reports(is_public);
CREATE INDEX IF NOT EXISTS reports_location_idx ON public.reports(location_lat, location_lng);

-- Índices para comments
CREATE INDEX IF NOT EXISTS comments_report_id_idx ON public.comments(report_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON public.comments(created_at DESC);

-- Índices para ratings
CREATE INDEX IF NOT EXISTS ratings_report_id_idx ON public.ratings(report_id);
CREATE INDEX IF NOT EXISTS ratings_user_id_idx ON public.ratings(user_id);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- ============================================
-- TRIGGERS para actualizar updated_at automáticamente
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para cada tabla
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER entities_updated_at
  BEFORE UPDATE ON public.entities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- TRIGGER para crear perfil automáticamente al registrarse
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    'ciudadano'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil al crear usuario en auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Políticas de Seguridad
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS para PROFILES
-- ============================================

-- Los usuarios pueden ver todos los perfiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Los usuarios pueden actualizar solo su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Los admins pueden actualizar cualquier perfil
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- POLÍTICAS RLS para ENTITIES
-- ============================================

-- Todos pueden ver las entidades activas
CREATE POLICY "Entities are viewable by everyone"
  ON public.entities FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

-- Solo los admins pueden crear entidades
CREATE POLICY "Admins can create entities"
  ON public.entities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Solo los admins pueden actualizar entidades
CREATE POLICY "Admins can update entities"
  ON public.entities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Solo los admins pueden eliminar entidades
CREATE POLICY "Admins can delete entities"
  ON public.entities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- POLÍTICAS RLS para REPORTS
-- ============================================

-- Los usuarios autenticados pueden ver reportes públicos
CREATE POLICY "Public reports are viewable by authenticated users"
  ON public.reports FOR SELECT
  USING (
    is_public = true OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los usuarios autenticados pueden crear reportes
CREATE POLICY "Authenticated users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propios reportes
CREATE POLICY "Users can update own reports"
  ON public.reports FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Los admins pueden actualizar cualquier reporte
CREATE POLICY "Admins can update any report"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los usuarios pueden eliminar sus propios reportes
CREATE POLICY "Users can delete own reports"
  ON public.reports FOR DELETE
  USING (user_id = auth.uid());

-- Los admins pueden eliminar cualquier reporte
CREATE POLICY "Admins can delete any report"
  ON public.reports FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- POLÍTICAS RLS para COMMENTS
-- ============================================

-- Los comentarios son visibles para usuarios autenticados
CREATE POLICY "Comments are viewable by authenticated users"
  ON public.comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Los usuarios autenticados pueden crear comentarios
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propios comentarios
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (user_id = auth.uid());

-- Los usuarios pueden eliminar sus propios comentarios
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (user_id = auth.uid());

-- Los admins pueden eliminar cualquier comentario
CREATE POLICY "Admins can delete any comment"
  ON public.comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- POLÍTICAS RLS para RATINGS
-- ============================================

-- Las calificaciones son visibles para todos los usuarios autenticados
CREATE POLICY "Ratings are viewable by authenticated users"
  ON public.ratings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Los usuarios autenticados pueden crear calificaciones
CREATE POLICY "Authenticated users can create ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias calificaciones
CREATE POLICY "Users can update own ratings"
  ON public.ratings FOR UPDATE
  USING (user_id = auth.uid());

-- Los usuarios pueden eliminar sus propias calificaciones
CREATE POLICY "Users can delete own ratings"
  ON public.ratings FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- POLÍTICAS RLS para NOTIFICATIONS
-- ============================================

-- Los usuarios solo pueden ver sus propias notificaciones
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- El sistema puede crear notificaciones (via service role)
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Los usuarios pueden actualizar sus propias notificaciones
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Los usuarios pueden eliminar sus propias notificaciones
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- VISTAS para facilitar consultas
-- ============================================

-- Vista de reportes con información de usuario y entidad
CREATE OR REPLACE VIEW public.reports_with_details AS
SELECT 
  r.*,
  p.name as user_name,
  p.email as user_email,
  e.name as entity_name_full,
  e.contact_email as entity_contact_email,
  e.contact_phone as entity_contact_phone,
  (
    SELECT COUNT(*)::int 
    FROM public.comments c 
    WHERE c.report_id = r.id
  ) as comments_count,
  (
    SELECT COALESCE(AVG(rating)::numeric(3,2), 0) 
    FROM public.ratings rt 
    WHERE rt.report_id = r.id
  ) as average_rating,
  (
    SELECT COUNT(*)::int 
    FROM public.ratings rt 
    WHERE rt.report_id = r.id
  ) as ratings_count
FROM public.reports r
LEFT JOIN public.profiles p ON r.user_id = p.id
LEFT JOIN public.entities e ON r.entity_id = e.id;

-- Vista de estadísticas de reportes por entidad
CREATE OR REPLACE VIEW public.entity_statistics AS
SELECT 
  e.id,
  e.name,
  e.category,
  COUNT(r.id) as total_reports,
  COUNT(CASE WHEN r.status = 'pendiente' THEN 1 END) as pending_reports,
  COUNT(CASE WHEN r.status = 'en_proceso' THEN 1 END) as in_progress_reports,
  COUNT(CASE WHEN r.status = 'resuelto' THEN 1 END) as resolved_reports,
  COALESCE(AVG(rt.rating)::numeric(3,2), 0) as average_rating
FROM public.entities e
LEFT JOIN public.reports r ON e.id = r.entity_id
LEFT JOIN public.ratings rt ON r.id = rt.report_id
GROUP BY e.id, e.name, e.category;

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función para obtener reportes cercanos a una ubicación
CREATE OR REPLACE FUNCTION public.get_nearby_reports(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 5.0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.description,
    (
      6371 * acos(
        cos(radians(lat)) * 
        cos(radians(r.location_lat)) * 
        cos(radians(r.location_lng) - radians(lng)) + 
        sin(radians(lat)) * 
        sin(radians(r.location_lat))
      )
    ) as distance_km
  FROM public.reports r
  WHERE 
    r.location_lat IS NOT NULL AND
    r.location_lng IS NOT NULL AND
    r.is_public = true AND
    (
      6371 * acos(
        cos(radians(lat)) * 
        cos(radians(r.location_lat)) * 
        cos(radians(r.location_lng) - radians(lng)) + 
        sin(radians(lat)) * 
        sin(radians(r.location_lat))
      )
    ) <= radius_km
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas del dashboard
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_reports', (SELECT COUNT(*) FROM public.reports),
    'pending_reports', (SELECT COUNT(*) FROM public.reports WHERE status = 'pendiente'),
    'in_progress_reports', (SELECT COUNT(*) FROM public.reports WHERE status = 'en_proceso'),
    'resolved_reports', (SELECT COUNT(*) FROM public.reports WHERE status = 'resuelto'),
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_citizens', (SELECT COUNT(*) FROM public.profiles WHERE role = 'ciudadano'),
    'total_admins', (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin'),
    'total_entities', (SELECT COUNT(*) FROM public.entities WHERE is_active = true),
    'reports_this_month', (
      SELECT COUNT(*) FROM public.reports 
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
    ),
    'reports_this_week', (
      SELECT COUNT(*) FROM public.reports 
      WHERE created_at >= date_trunc('week', CURRENT_DATE)
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DATOS INICIALES - Entidades por defecto
-- ============================================

INSERT INTO public.entities (name, description, category, keywords) VALUES
  ('Alcaldía de Buenaventura', 'Alcaldía Municipal de Buenaventura', 'gobierno', ARRAY['alcaldia', 'gobierno', 'municipal', 'administracion']),
  ('Secretaría de Infraestructura', 'Secretaría de Infraestructura y Obras Públicas', 'infraestructura', ARRAY['infraestructura', 'obras', 'construccion', 'vias', 'calles', 'carreteras', 'puentes', 'huecos', 'pavimento']),
  ('Aguas de Buenaventura', 'Empresa de Acueducto y Alcantarillado', 'servicios', ARRAY['agua', 'acueducto', 'alcantarillado', 'tuberias', 'fuga', 'desague', 'sanitario']),
  ('EPSA - Energía del Pacífico', 'Empresa de Energía Eléctrica', 'servicios', ARRAY['energia', 'luz', 'electricidad', 'alumbrado', 'postes', 'cables', 'transformador', 'apagon']),
  ('Secretaría de Salud', 'Secretaría de Salud Municipal', 'salud', ARRAY['salud', 'hospital', 'centro de salud', 'epidemia', 'sanitario', 'enfermedad']),
  ('Policía Nacional', 'Policía Nacional de Colombia', 'seguridad', ARRAY['policia', 'seguridad', 'delincuencia', 'robo', 'crimen', 'emergencia']),
  ('Bomberos Buenaventura', 'Cuerpo de Bomberos Voluntarios', 'emergencia', ARRAY['bomberos', 'incendio', 'fuego', 'rescate', 'emergencia']),
  ('Cruz Roja', 'Cruz Roja Colombiana - Seccional Buenaventura', 'emergencia', ARRAY['cruz roja', 'emergencia', 'primeros auxilios', 'ambulancia']),
  ('Secretaría de Ambiente', 'Secretaría de Medio Ambiente', 'ambiente', ARRAY['ambiente', 'basura', 'residuos', 'contaminacion', 'reciclaje', 'aseo', 'limpieza', 'arboles']),
  ('Secretaría de Tránsito', 'Secretaría de Tránsito y Transporte', 'transito', ARRAY['transito', 'transporte', 'semaforo', 'señalizacion', 'accidente', 'via', 'trafico']),
  ('Defensa Civil', 'Defensa Civil Colombiana', 'emergencia', ARRAY['defensa civil', 'emergencia', 'desastre', 'inundacion', 'deslizamiento'])
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Comentarios de documentación
-- ============================================

COMMENT ON TABLE public.profiles IS 'Perfiles de usuarios con información adicional';
COMMENT ON TABLE public.entities IS 'Entidades responsables de atender reportes';
COMMENT ON TABLE public.reports IS 'Reportes de problemas urbanos creados por ciudadanos';
COMMENT ON TABLE public.comments IS 'Comentarios en los reportes para seguimiento y discusión';
COMMENT ON TABLE public.ratings IS 'Calificaciones de reportes resueltos (1-5 estrellas)';
COMMENT ON TABLE public.notifications IS 'Notificaciones push para los usuarios';

COMMENT ON COLUMN public.reports.is_anonymous IS 'Si el reporte es anónimo, no se muestra información del usuario';
COMMENT ON COLUMN public.reports.is_public IS 'Si el reporte es público, cualquiera puede verlo';
COMMENT ON COLUMN public.reports.priority IS 'Prioridad del reporte: baja, media, alta, urgente';

-- ============================================
-- GRANTS - Permisos para usuarios autenticados
-- ============================================

-- Permitir acceso a la secuencia de IDs
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
