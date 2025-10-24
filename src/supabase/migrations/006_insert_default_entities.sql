-- =====================================================
-- INSERTAR ENTIDADES PREDETERMINADAS
-- =====================================================
-- Este script inserta las 11 entidades predeterminadas
-- directamente en la tabla `entities`
-- =====================================================

-- Eliminar entidades existentes (opcional)
-- TRUNCATE TABLE public.entities CASCADE;

-- Insertar las 11 entidades predeterminadas
INSERT INTO public.entities (
  name,
  description,
  category,
  contact_email,
  contact_phone,
  website,
  address,
  keywords,
  is_active
) VALUES
  (
    'Alcaldía de Buenaventura - Infraestructura Vial',
    'Responsable de mantenimiento y construcción de vías, puentes y obras de infraestructura pública',
    'Infraestructura',
    'infraestructura@buenaventura.gov.co',
    '+57 2 2430000',
    'https://www.buenaventura.gov.co',
    'Calle 1 # 1-20, Centro, Buenaventura',
    ARRAY['infraestructura', 'vias', 'calles', 'puentes', 'huecos', 'pavimento', 'construccion', 'obras'],
    true
  ),
  (
    'Secretaría de Servicios Públicos',
    'Gestión de alumbrado público, parques, zonas verdes y espacios públicos',
    'Servicios Públicos',
    'servicios.publicos@buenaventura.gov.co',
    '+57 2 2430100',
    'https://www.buenaventura.gov.co',
    'Calle 1 # 1-20, Centro, Buenaventura',
    ARRAY['servicios', 'alumbrado', 'parques', 'zonas verdes', 'espacios publicos', 'luz'],
    true
  ),
  (
    'Empresa Municipal de Aseo - EMSIRVA',
    'Recolección de residuos sólidos, aseo urbano y limpieza de espacios públicos',
    'Aseo y Limpieza',
    'emsirva@buenaventura.gov.co',
    '+57 2 2430200',
    'https://www.emsirva.gov.co',
    'Carrera 3 # 2-50, Buenaventura',
    ARRAY['aseo', 'basura', 'residuos', 'limpieza', 'recoleccion', 'reciclaje'],
    true
  ),
  (
    'Acueducto y Alcantarillado de Buenaventura',
    'Suministro de agua potable, alcantarillado y saneamiento básico',
    'Servicios Públicos',
    'acueducto@buenaventura.gov.co',
    '+57 2 2430300',
    'https://www.acueductobga.gov.co',
    'Calle 5 # 3-10, Buenaventura',
    ARRAY['agua', 'acueducto', 'alcantarillado', 'tuberias', 'fuga', 'desague', 'sanitario'],
    true
  ),
  (
    'Policía Nacional - CAI Buenaventura',
    'Seguridad ciudadana, orden público y atención de emergencias policiales',
    'Seguridad',
    'policia.buenaventura@policia.gov.co',
    '123',
    'https://www.policia.gov.co',
    'Calle 2 # 4-30, Buenaventura',
    ARRAY['policia', 'seguridad', 'emergencia', 'robo', 'delincuencia', 'orden publico'],
    true
  ),
  (
    'Bomberos Voluntarios de Buenaventura',
    'Atención de incendios, rescates y emergencias',
    'Emergencias',
    'bomberos@buenaventura.gov.co',
    '119',
    'https://www.bomberos.gov.co',
    'Carrera 5 # 6-15, Buenaventura',
    ARRAY['bomberos', 'incendio', 'fuego', 'rescate', 'emergencia'],
    true
  ),
  (
    'Cruz Roja Colombiana - Buenaventura',
    'Atención médica de emergencia, primeros auxilios y servicios humanitarios',
    'Emergencias',
    'cruzroja@buenaventura.org.co',
    '132',
    'https://www.cruzroja.org.co',
    'Avenida Simón Bolívar # 8-30, Buenaventura',
    ARRAY['cruz roja', 'emergencia', 'primeros auxilios', 'ambulancia', 'salud'],
    true
  ),
  (
    'Secretaría de Salud Municipal',
    'Gestión de programas de salud pública y atención primaria',
    'Salud',
    'salud@buenaventura.gov.co',
    '+57 2 2430400',
    'https://www.buenaventura.gov.co/salud',
    'Calle 1 # 1-20, Centro, Buenaventura',
    ARRAY['salud', 'hospital', 'centro de salud', 'epidemia', 'vacunacion', 'medicamentos'],
    true
  ),
  (
    'Hospital Departamental de Buenaventura',
    'Atención médica hospitalaria y servicios de urgencias',
    'Salud',
    'hospital@buenaventura.gov.co',
    '+57 2 2430500',
    'https://www.hospitalbga.gov.co',
    'Avenida Simón Bolívar # 10-50, Buenaventura',
    ARRAY['hospital', 'urgencias', 'emergencia medica', 'cirugia', 'hospitalizacion'],
    true
  ),
  (
    'Defensoría del Espacio Público',
    'Protección y recuperación del espacio público, control de ventas ambulantes',
    'Gobierno',
    'espacio.publico@buenaventura.gov.co',
    '+57 2 2430600',
    'https://www.buenaventura.gov.co',
    'Calle 1 # 1-20, Centro, Buenaventura',
    ARRAY['espacio publico', 'ventas ambulantes', 'invasiones', 'ocupacion', 'via publica'],
    true
  ),
  (
    'Alcaldía de Buenaventura - Otros Servicios',
    'Otros reportes, quejas y servicios municipales generales',
    'Otros',
    'contacto@buenaventura.gov.co',
    '+57 2 2430000',
    'https://www.buenaventura.gov.co',
    'Calle 1 # 1-20, Centro, Buenaventura',
    ARRAY['alcaldia', 'gobierno', 'quejas', 'peticiones', 'otros'],
    true
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  website = EXCLUDED.website,
  address = EXCLUDED.address,
  keywords = EXCLUDED.keywords,
  is_active = EXCLUDED.is_active;

-- Verificar que las entidades se insertaron correctamente
SELECT 
  COUNT(*) as total_entidades,
  STRING_AGG(name, ', ' ORDER BY name) as nombres_entidades
FROM public.entities
WHERE is_active = true;

-- Mostrar todas las entidades
SELECT 
  id,
  name,
  category,
  contact_phone,
  contact_email
FROM public.entities
WHERE is_active = true
ORDER BY name;
