-- =====================================================
-- INICIALIZACIÓN DE ENTIDADES EN SUPABASE
-- =====================================================
-- Este script inicializa las entidades predeterminadas
-- en el KV store de Supabase
-- =====================================================

-- Función para inicializar entidades si no existen
DO $$
DECLARE
    entities_json JSONB;
BEGIN
    -- Verificar si ya existen entidades
    SELECT value INTO entities_json 
    FROM kv_store_e2de53ff 
    WHERE key = 'entities';
    
    -- Si no existen, inicializar con las entidades predeterminadas
    IF entities_json IS NULL OR jsonb_array_length(entities_json) = 0 THEN
        INSERT INTO kv_store_e2de53ff (key, value)
        VALUES ('entities', '[
            {
                "id": "1",
                "name": "Alcaldía de Buenaventura - Infraestructura Vial",
                "description": "Responsable de mantenimiento y construcción de vías, puentes y obras de infraestructura pública",
                "category": "Infraestructura",
                "email": "infraestructura@buenaventura.gov.co",
                "phone": "+57 2 2430000",
                "website": "https://www.buenaventura.gov.co",
                "createdAt": "2025-01-15T00:00:00.000Z"
            },
            {
                "id": "2",
                "name": "Secretaría de Servicios Públicos",
                "description": "Gestión de alumbrado público, parques, zonas verdes y espacios públicos",
                "category": "Servicios Públicos",
                "email": "servicios.publicos@buenaventura.gov.co",
                "phone": "+57 2 2430100",
                "website": "https://www.buenaventura.gov.co",
                "createdAt": "2025-01-15T00:00:00.000Z"
            },
            {
                "id": "3",
                "name": "Empresa Municipal de Aseo - EMSIRVA",
                "description": "Recolección de residuos sólidos, aseo urbano y limpieza de espacios públicos",
                "category": "Aseo y Limpieza",
                "email": "emsirva@buenaventura.gov.co",
                "phone": "+57 2 2430200",
                "website": "https://www.emsirva.gov.co",
                "createdAt": "2025-01-15T00:00:00.000Z"
            },
            {
                "id": "4",
                "name": "Acueducto y Alcantarillado de Buenaventura",
                "description": "Suministro de agua potable, alcantarillado y saneamiento básico",
                "category": "Servicios Públicos",
                "email": "acueducto@buenaventura.gov.co",
                "phone": "+57 2 2430300",
                "website": "https://www.acueductobga.gov.co",
                "createdAt": "2025-01-15T00:00:00.000Z"
            },
            {
                "id": "5",
                "name": "Policía Nacional - CAI Buenaventura",
                "description": "Seguridad ciudadana, orden público y atención de emergencias policiales",
                "category": "Seguridad",
                "email": "policia.buenaventura@policia.gov.co",
                "phone": "123",
                "website": "https://www.policia.gov.co",
                "createdAt": "2025-01-15T00:00:00.000Z"
            },
            {
                "id": "6",
                "name": "Bomberos Voluntarios de Buenaventura",
                "description": "Atención de incendios, rescates y emergencias",
                "category": "Emergencias",
                "email": "bomberos@buenaventura.gov.co",
                "phone": "119",
                "website": "https://www.bomberos.gov.co",
                "createdAt": "2025-01-15T00:00:00.000Z"
            },
            {
                "id": "7",
                "name": "Cruz Roja Colombiana - Buenaventura",
                "description": "Atención médica de emergencia, primeros auxilios y servicios humanitarios",
                "category": "Emergencias",
                "email": "cruzroja@buenaventura.org.co",
                "phone": "132",
                "website": "https://www.cruzroja.org.co",
                "createdAt": "2025-01-15T00:00:00.000Z"
            },
            {
                "id": "8",
                "name": "Secretaría de Salud Municipal",
                "description": "Gestión de programas de salud pública y atención primaria",
                "category": "Salud",
                "email": "salud@buenaventura.gov.co",
                "phone": "+57 2 2430400",
                "website": "https://www.buenaventura.gov.co/salud",
                "createdAt": "2025-01-15T00:00:00.000Z"
            },
            {
                "id": "9",
                "name": "Hospital Departamental de Buenaventura",
                "description": "Atención médica hospitalaria y servicios de urgencias",
                "category": "Salud",
                "email": "hospital@buenaventura.gov.co",
                "phone": "+57 2 2430500",
                "website": "https://www.hospitalbga.gov.co",
                "createdAt": "2025-01-15T00:00:00.000Z"
            },
            {
                "id": "10",
                "name": "Defensoría del Espacio Público",
                "description": "Protección y recuperación del espacio público, control de ventas ambulantes",
                "category": "Gobierno",
                "email": "espacio.publico@buenaventura.gov.co",
                "phone": "+57 2 2430600",
                "website": "https://www.buenaventura.gov.co",
                "createdAt": "2025-01-15T00:00:00.000Z"
            },
            {
                "id": "11",
                "name": "Alcaldía de Buenaventura - Otros Servicios",
                "description": "Otros reportes, quejas y servicios municipales generales",
                "category": "Otros",
                "email": "contacto@buenaventura.gov.co",
                "phone": "+57 2 2430000",
                "website": "https://www.buenaventura.gov.co",
                "createdAt": "2025-01-15T00:00:00.000Z"
            }
        ]'::jsonb)
        ON CONFLICT (key) 
        DO UPDATE SET value = EXCLUDED.value;
        
        RAISE NOTICE 'Entidades inicializadas exitosamente: 11 entidades creadas';
    ELSE
        RAISE NOTICE 'Las entidades ya existen en la base de datos: % entidades', jsonb_array_length(entities_json);
    END IF;
END $$;

-- Verificar que las entidades se crearon correctamente
SELECT 
    key,
    jsonb_array_length(value) as total_entidades,
    value->0->>'name' as primera_entidad,
    value->10->>'name' as ultima_entidad
FROM kv_store_e2de53ff 
WHERE key = 'entities';
