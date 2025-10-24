-- ============================================
-- Script de Verificación de Base de Datos
-- ============================================
-- Ejecuta este script para verificar que la base de datos
-- está configurada correctamente

-- ============================================
-- 1. Verificar que todas las tablas existen
-- ============================================

SELECT 
  'Verificando tablas...' as status;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('profiles', 'entities', 'reports', 'comments', 'ratings', 'notifications') 
    THEN '✅ Existe'
    ELSE '❌ No esperada'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- 2. Verificar conteo de registros en cada tabla
-- ============================================

SELECT 'Conteo de registros en cada tabla...' as status;

SELECT 
  'profiles' as tabla,
  COUNT(*) as registros,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN role = 'ciudadano' THEN 1 END) as ciudadanos
FROM public.profiles

UNION ALL

SELECT 
  'entities' as tabla,
  COUNT(*) as registros,
  COUNT(CASE WHEN is_active = true THEN 1 END) as activas,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactivas
FROM public.entities

UNION ALL

SELECT 
  'reports' as tabla,
  COUNT(*) as registros,
  COUNT(CASE WHEN status = 'pendiente' THEN 1 END) as pendientes,
  COUNT(CASE WHEN status = 'resuelto' THEN 1 END) as resueltos
FROM public.reports

UNION ALL

SELECT 
  'comments' as tabla,
  COUNT(*) as registros,
  NULL as col2,
  NULL as col3
FROM public.comments

UNION ALL

SELECT 
  'ratings' as tabla,
  COUNT(*) as registros,
  NULL as col2,
  NULL as col3
FROM public.ratings

UNION ALL

SELECT 
  'notifications' as tabla,
  COUNT(*) as registros,
  COUNT(CASE WHEN is_read = false THEN 1 END) as no_leidas,
  COUNT(CASE WHEN is_read = true THEN 1 END) as leidas
FROM public.notifications;

-- ============================================
-- 3. Verificar que RLS está habilitado
-- ============================================

SELECT 'Verificando Row Level Security (RLS)...' as status;

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Habilitado'
    ELSE '❌ RLS Deshabilitado'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'entities', 'reports', 'comments', 'ratings', 'notifications')
ORDER BY tablename;

-- ============================================
-- 4. Verificar políticas RLS
-- ============================================

SELECT 'Verificando políticas RLS...' as status;

SELECT 
  tablename,
  policyname,
  permissive,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN '✅ Con condición'
    ELSE 'Sin condición'
  END as has_condition
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 5. Verificar índices
-- ============================================

SELECT 'Verificando índices...' as status;

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'entities', 'reports', 'comments', 'ratings', 'notifications')
ORDER BY tablename, indexname;

-- ============================================
-- 6. Verificar triggers
-- ============================================

SELECT 'Verificando triggers...' as status;

SELECT 
  trigger_name,
  event_object_table as table_name,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 7. Verificar funciones auxiliares
-- ============================================

SELECT 'Verificando funciones auxiliares...' as status;

SELECT 
  routine_name as function_name,
  routine_type,
  CASE 
    WHEN routine_name IN ('handle_updated_at', 'handle_new_user', 'get_nearby_reports', 'get_dashboard_stats', 'promote_to_admin')
    THEN '✅ Función esperada'
    ELSE 'Función adicional'
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ============================================
-- 8. Verificar vistas
-- ============================================

SELECT 'Verificando vistas...' as status;

SELECT 
  table_name as view_name,
  CASE 
    WHEN table_name IN ('reports_with_details', 'entity_statistics')
    THEN '✅ Vista esperada'
    ELSE 'Vista adicional'
  END as status
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 9. Verificar entidades predefinidas
-- ============================================

SELECT 'Verificando entidades predefinidas...' as status;

SELECT 
  name,
  category,
  is_active,
  CASE 
    WHEN name IN (
      'Alcaldía de Buenaventura',
      'Secretaría de Infraestructura',
      'Aguas de Buenaventura',
      'EPSA - Energía del Pacífico',
      'Secretaría de Salud',
      'Policía Nacional',
      'Bomberos Buenaventura',
      'Cruz Roja',
      'Secretaría de Ambiente',
      'Secretaría de Tránsito',
      'Defensa Civil'
    ) THEN '✅ Entidad esperada'
    ELSE 'Entidad adicional'
  END as status
FROM public.entities
ORDER BY name;

-- ============================================
-- 10. Verificar usuarios admin
-- ============================================

SELECT 'Verificando usuarios administradores...' as status;

SELECT 
  id,
  email,
  name,
  role,
  created_at,
  '✅ Usuario Admin' as status
FROM public.profiles
WHERE role = 'admin'
ORDER BY created_at;

-- ============================================
-- 11. Prueba de estadísticas del dashboard
-- ============================================

SELECT 'Probando función get_dashboard_stats()...' as status;

SELECT * FROM public.get_dashboard_stats();

-- ============================================
-- 12. Resumen final
-- ============================================

SELECT 'RESUMEN DE VERIFICACIÓN' as status;

SELECT 
  'Total de tablas' as item,
  COUNT(*) as valor
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
  'Total de políticas RLS' as item,
  COUNT(*) as valor
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Total de índices' as item,
  COUNT(*) as valor
FROM pg_indexes 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Total de triggers' as item,
  COUNT(*) as valor
FROM information_schema.triggers 
WHERE trigger_schema = 'public'

UNION ALL

SELECT 
  'Total de funciones' as item,
  COUNT(*) as valor
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'

UNION ALL

SELECT 
  'Total de vistas' as item,
  COUNT(*) as valor
FROM information_schema.views 
WHERE table_schema = 'public'

UNION ALL

SELECT 
  'Total de entidades' as item,
  COUNT(*) as valor
FROM public.entities

UNION ALL

SELECT 
  'Total de usuarios' as item,
  COUNT(*) as valor
FROM public.profiles

UNION ALL

SELECT 
  'Total de reportes' as item,
  COUNT(*) as valor
FROM public.reports;

-- ============================================
-- Mensaje final
-- ============================================

SELECT 
  '🎉 Verificación completada!' as mensaje,
  'Si todos los checks muestran ✅, la base de datos está correctamente configurada.' as nota;
