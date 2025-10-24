-- ============================================
-- Crear Usuario Administrador Inicial
-- ============================================
-- IMPORTANTE: Ejecuta este script DESPUÉS de la migración inicial
-- Este script crea un usuario administrador para acceder al sistema

-- NOTA: Cambia el email y password según tus necesidades
-- El password debe tener al menos 6 caracteres

-- Opción 1: Crear admin con datos de prueba
-- Puedes ejecutar esto directamente en el SQL Editor

-- PRIMERO: Crear el usuario en auth.users manualmente desde Supabase Dashboard
-- Ve a Authentication > Users > Add user
-- Email: admin@reportebuenaventura.com
-- Password: Admin@2025 (o el que prefieras)
-- Auto Confirm User: ON

-- DESPUÉS: Actualizar el rol del usuario a 'admin'
-- Reemplaza 'admin@reportebuenaventura.com' con el email que usaste

UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@reportebuenaventura.com';

-- ============================================
-- Verificar que el usuario admin se creó correctamente
-- ============================================

SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM public.profiles
WHERE role = 'admin';

-- ============================================
-- Crear múltiples usuarios admin si es necesario
-- ============================================

-- Si quieres convertir otros usuarios existentes en admin:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'otro@email.com';

-- ============================================
-- Función helper para promover usuarios a admin
-- ============================================

CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  UPDATE public.profiles 
  SET role = 'admin' 
  WHERE email = user_email
  RETURNING json_build_object(
    'id', id,
    'email', email,
    'name', name,
    'role', role
  ) INTO result;
  
  IF result IS NULL THEN
    RAISE EXCEPTION 'Usuario con email % no encontrado', user_email;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejemplo de uso:
-- SELECT public.promote_to_admin('usuario@email.com');

-- ============================================
-- Notas Importantes
-- ============================================

-- 1. El usuario admin tiene permisos completos en el sistema:
--    - Puede ver, editar y eliminar todos los reportes
--    - Puede gestionar entidades
--    - Puede cambiar roles de usuarios
--    - Puede ver analytics y estadísticas

-- 2. Para crear más usuarios admin en el futuro:
--    a) Primero el usuario debe registrarse normalmente
--    b) Luego un admin existente puede cambiar su rol desde el panel de administración
--    c) O puedes ejecutar: UPDATE public.profiles SET role = 'admin' WHERE email = 'nuevo@admin.com';

-- 3. Seguridad:
--    - Usa contraseñas fuertes para cuentas admin
--    - No compartas las credenciales de admin
--    - Considera habilitar 2FA (Two-Factor Authentication) en Supabase
