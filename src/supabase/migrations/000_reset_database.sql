-- ============================================
-- SCRIPT DE RESET/LIMPIEZA DE BASE DE DATOS
-- ============================================
-- ⚠️ ADVERTENCIA: Este script ELIMINARÁ todas las tablas y datos
-- Solo ejecuta esto si quieres empezar desde cero
-- ============================================

-- IMPORTANTE: Descomenta las líneas que quieras ejecutar

-- ============================================
-- Opción 1: ELIMINAR TODO (Reset Completo)
-- ============================================
-- Solo descomenta esto si estás 100% seguro
-- Esto eliminará TODAS las tablas y TODOS los datos

/*
-- Eliminar vistas primero
DROP VIEW IF EXISTS public.reports_with_details CASCADE;
DROP VIEW IF EXISTS public.entity_statistics CASCADE;

-- Eliminar funciones
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_nearby_reports(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS public.get_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.promote_to_admin(TEXT) CASCADE;

-- Eliminar tablas (en orden inverso de dependencias)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.entities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Mensaje de confirmación
SELECT '✅ Base de datos completamente eliminada. Ejecuta 001_initial_schema.sql para recrearla.' as mensaje;
*/

-- ============================================
-- Opción 2: LIMPIAR SOLO DATOS (Mantener Estructura)
-- ============================================
-- Esto elimina los datos pero mantiene las tablas y estructura
-- Útil para empezar con datos limpios sin recrear todo

/*
-- Limpiar datos en orden (respetando foreign keys)
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.ratings CASCADE;
TRUNCATE TABLE public.comments CASCADE;
TRUNCATE TABLE public.reports CASCADE;
-- NO eliminamos entities porque son las predefinidas
-- TRUNCATE TABLE public.entities CASCADE; 
-- NO eliminamos profiles porque están vinculados a auth.users
-- Los usuarios deberán eliminarse desde Authentication en Supabase

-- Mensaje de confirmación
SELECT '✅ Datos de reportes, comentarios, calificaciones y notificaciones eliminados.' as mensaje;
SELECT 'ℹ️ Las entidades y usuarios se mantienen.' as nota;
*/

-- ============================================
-- Opción 3: ELIMINAR SOLO REPORTES DE PRUEBA
-- ============================================
-- Elimina reportes que contengan "prueba" o "test" en el título

/*
DELETE FROM public.notifications 
WHERE report_id IN (
  SELECT id FROM public.reports 
  WHERE LOWER(title) LIKE '%prueba%' 
  OR LOWER(title) LIKE '%test%'
);

DELETE FROM public.ratings 
WHERE report_id IN (
  SELECT id FROM public.reports 
  WHERE LOWER(title) LIKE '%prueba%' 
  OR LOWER(title) LIKE '%test%'
);

DELETE FROM public.comments 
WHERE report_id IN (
  SELECT id FROM public.reports 
  WHERE LOWER(title) LIKE '%prueba%' 
  OR LOWER(title) LIKE '%test%'
);

DELETE FROM public.reports 
WHERE LOWER(title) LIKE '%prueba%' 
OR LOWER(title) LIKE '%test%';

-- Mensaje de confirmación
SELECT '✅ Reportes de prueba eliminados.' as mensaje;
*/

-- ============================================
-- Opción 4: ELIMINAR TODOS LOS REPORTES
-- ============================================
-- Elimina TODOS los reportes y datos relacionados
-- Mantiene usuarios y entidades

/*
-- Eliminar en orden correcto (respetando foreign keys)
DELETE FROM public.notifications WHERE report_id IS NOT NULL;
DELETE FROM public.ratings;
DELETE FROM public.comments;
DELETE FROM public.reports;

-- Mensaje de confirmación
SELECT '✅ Todos los reportes eliminados.' as mensaje;
SELECT 'ℹ️ Usuarios y entidades se mantienen.' as nota;
*/

-- ============================================
-- Opción 5: RESETEAR ENTIDADES A PREDEFINIDAS
-- ============================================
-- Elimina todas las entidades y recrea las 11 predefinidas

/*
-- Primero, desasignar entidades de reportes existentes
UPDATE public.reports SET entity_id = NULL;

-- Eliminar todas las entidades
TRUNCATE TABLE public.entities CASCADE;

-- Recrear las 11 entidades predefinidas
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
  ('Defensa Civil', 'Defensa Civil Colombiana', 'emergencia', ARRAY['defensa civil', 'emergencia', 'desastre', 'inundacion', 'deslizamiento']);

-- Mensaje de confirmación
SELECT '✅ Entidades reseteadas a las 11 predefinidas.' as mensaje;
*/

-- ============================================
-- Opción 6: ELIMINAR USUARIOS NO ADMIN
-- ============================================
-- Mantiene solo los usuarios con rol admin
-- ADVERTENCIA: Esto también eliminará sus reportes

/*
-- Primero, eliminar datos relacionados de usuarios ciudadanos
DELETE FROM public.notifications 
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE role = 'ciudadano'
);

DELETE FROM public.ratings 
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE role = 'ciudadano'
);

DELETE FROM public.comments 
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE role = 'ciudadano'
);

DELETE FROM public.reports 
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE role = 'ciudadano'
);

-- Eliminar perfiles de ciudadanos
-- Nota: También debes eliminar de auth.users manualmente
DELETE FROM public.profiles WHERE role = 'ciudadano';

-- Mensaje de confirmación
SELECT '✅ Usuarios ciudadanos eliminados. Solo quedan admins.' as mensaje;
SELECT '⚠️ IMPORTANTE: También elimina estos usuarios desde Authentication > Users en Supabase' as advertencia;
*/

-- ============================================
-- Opción 7: VERIFICAR ESTADO ACTUAL
-- ============================================
-- No elimina nada, solo muestra estadísticas actuales
-- Puedes ejecutar esto siempre que quieras

SELECT 'ESTADÍSTICAS ACTUALES' as seccion;

SELECT 
  'Perfiles' as tabla,
  COUNT(*) as total,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN role = 'ciudadano' THEN 1 END) as ciudadanos
FROM public.profiles
UNION ALL
SELECT 
  'Entidades' as tabla,
  COUNT(*) as total,
  COUNT(CASE WHEN is_active THEN 1 END) as activas,
  COUNT(CASE WHEN NOT is_active THEN 1 END) as inactivas
FROM public.entities
UNION ALL
SELECT 
  'Reportes' as tabla,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'pendiente' THEN 1 END) as pendientes,
  COUNT(CASE WHEN status = 'resuelto' THEN 1 END) as resueltos
FROM public.reports
UNION ALL
SELECT 
  'Comentarios' as tabla,
  COUNT(*) as total,
  NULL as col2,
  NULL as col3
FROM public.comments
UNION ALL
SELECT 
  'Calificaciones' as tabla,
  COUNT(*) as total,
  NULL as col2,
  NULL as col3
FROM public.ratings
UNION ALL
SELECT 
  'Notificaciones' as tabla,
  COUNT(*) as total,
  COUNT(CASE WHEN NOT is_read THEN 1 END) as no_leidas,
  COUNT(CASE WHEN is_read THEN 1 END) as leidas
FROM public.notifications;

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================

SELECT '=====================================' as separador;
SELECT 'INSTRUCCIONES DE USO' as titulo;
SELECT '=====================================' as separador;

SELECT 
  'Este script tiene 7 opciones diferentes:' as instruccion
UNION ALL SELECT ''
UNION ALL SELECT '1. Reset Completo - Elimina TODO (tablas, funciones, datos)'
UNION ALL SELECT '2. Limpiar Datos - Mantiene estructura, elimina datos'
UNION ALL SELECT '3. Eliminar Reportes de Prueba - Solo elimina reportes con "prueba" o "test"'
UNION ALL SELECT '4. Eliminar Todos los Reportes - Mantiene usuarios y entidades'
UNION ALL SELECT '5. Resetear Entidades - Vuelve a las 11 predefinidas'
UNION ALL SELECT '6. Eliminar Usuarios Ciudadanos - Solo mantiene admins'
UNION ALL SELECT '7. Verificar Estado - Muestra estadísticas (seguro, no elimina nada)'
UNION ALL SELECT ''
UNION ALL SELECT 'Para usar una opción:'
UNION ALL SELECT '1. Abre este archivo'
UNION ALL SELECT '2. Busca la opción que necesitas'
UNION ALL SELECT '3. Quita los comentarios /* */ de esa sección'
UNION ALL SELECT '4. Ejecuta el script'
UNION ALL SELECT ''
UNION ALL SELECT '⚠️ ADVERTENCIA: Las opciones 1-6 eliminan datos'
UNION ALL SELECT '✅ La opción 7 es segura y puedes ejecutarla siempre';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
