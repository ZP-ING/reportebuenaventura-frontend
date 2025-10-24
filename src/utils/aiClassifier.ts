// Simulación de clasificación de reportes usando IA
// En producción, esto haría una llamada real a OpenAI API

interface ClassificationResult {
  entity: string;
  confidence: number;
  reasoning: string;
}

const ENTITY_KEYWORDS = {
  'Policía': [
    // Jerga colombiana para seguridad y delincuencia
    'disturbio', 'disturbios', 'asonada', 'tropel', 'desorden', 'bochinche', 'camorra', 'gresca',
    'pelea', 'riña', 'bronca', 'trifulca', 'agarrón', 'pelotera', 'problema', 'altercado',
    'ladrón', 'ladrones', 'raponero', 'raponeros', 'cogido', 'pillo', 'pillos', 'malandro', 'malandros',
    'atracador', 'atracadores', 'ñero', 'ñeros', 'maleta', 'maletas', 'bandido', 'bandidos',
    'robo', 'hurto', 'atraco', 'raponazo', 'pela', 'cosquilleo', 'fleteo', 'robar', 'robaron',
    'vicio', 'vicios', 'bazuco', 'perico', 'marihuana', 'mota', 'yerba', 'expendio', 'jibaro', 'jibaros',
    'vender droga', 'vendiendo droga', 'traficante', 'narcotráfico', 'narcos', 'traqueto', 'traquetos',
    'seguridad', 'inseguridad', 'peligro', 'peligroso', 'sospechoso', 'sospechosos', 'malandro',
    'pandilla', 'pandillas', 'combo', 'combos', 'parche', 'parches', 'gallada', 'galladas',
    'delincuencia', 'delincuente', 'delincuentes', 'malhechor', 'malhechores', 'criminal', 'criminales',
    'violencia', 'violento', 'agresión', 'agredir', 'golpear', 'golpearon', 'atacar', 'atacaron',
    'asalto', 'asaltaron', 'amenaza', 'amenazaron', 'intimidación', 'intimidar',
    'vandalismo', 'vandalos', 'daños', 'destrozo', 'destruyeron', 'rompieron', 'grafiti',
    'escándalo', 'bulla', 'desorden público', 'orden público', 'motín', 'manifestación violenta',
    'arma', 'armas', 'pistola', 'revólver', 'cuchillo', 'navaja', 'machete', 'fierro',
    'sicario', 'sicarios', 'pistolero', 'matón', 'paga diario', 'secuestro', 'extorsión',
    'patrulla', 'policía', 'cuadrante', 'cai', 'estación de policía', 'uniformado',
  ],
  
  'Bomberos': [
    // Jerga colombiana para incendios y emergencias
    'incendio', 'fuego', 'candela', 'fogata', 'quemadero', 'llamarada', 'llamas',
    'humo', 'humaredas', 'se está quemando', 'está quemando', 'está prendido', 'prendió',
    'arde', 'ardiendo', 'arder', 'quema', 'quemando', 'quemar', 'chispa', 'chispas',
    'rescate', 'rescatar', 'atrapado', 'atrapados', 'atascado', 'atorado', 'encerrado',
    'explosión', 'explotar', 'explotó', 'bomba', 'estalló', 'detonación', 'deflagración',
    'gas', 'fuga de gas', 'escape de gas', 'se huele a gas', 'olor a gas', 'cilindro',
    'gas propano', 'gas natural', 'pipeta', 'tanque de gas', 'bombona',
    'cortocircuito', 'corto', 'cables quemados', 'conexión eléctrica', 'chisporroteó',
    'brasas', 'cenizas', 'carbón', 'combustión', 'combustible', 'inflamable',
    'conato', 'conato de incendio', 'principio de incendio', 'amago',
    'extintor', 'extinguir', 'apagar', 'apagar el fuego', 'sofocar',
    'bombero', 'bomberos', 'cuerpo de bomberos', 'estación de bomberos',
  ],
  
  'Hospital': [
    // Jerga colombiana para emergencias médicas
    'médico', 'doctor', 'doctora', 'enfermera', 'enfermero', 'paramédico',
    'salud', 'emergencia médica', 'urgencia', 'urgencias', 'urgente',
    'herido', 'herida', 'heridos', 'lesión', 'lesionado', 'golpeado', 'golpe', 'golpes',
    'accidente', 'choque', 'chocó', 'colisión', 'atropellado', 'atropello',
    'ambulancia', 'ambulancias', 'camilla', 'paramédicos',
    'enfermo', 'enferma', 'maluco', 'maluca', 'mal', 'grave', 'gravemente', 'crítico', 'crítica',
    'desmayado', 'desmayada', 'desmayo', 'se desmayó', 'desvanecido', 'desvanecida',
    'inconsciente', 'sin conocimiento', 'perdió el conocimiento', 'no responde',
    'caído', 'caída', 'se cayó', 'tropezó', 'se pegó', 'se golpeó',
    'está tirado', 'está botado', 'tirado en el piso', 'en el suelo',
    'sangre', 'sangrando', 'sangra', 'hemorragia', 'desangrado', 'botando sangre',
    'fractura', 'roto', 'quebrado', 'quebradura', 'hueso roto', 'se quebró',
    'dolor', 'le duele', 'dolor fuerte', 'dolor agudo', 'sufriendo',
    'convulsión', 'convulsiones', 'temblores', 'espasmos', 'ataque',
    'infarto', 'paro', 'paro cardíaco', 'corazón', 'del corazón',
    'asfixia', 'no puede respirar', 'no respira', 'ahogado', 'se está ahogando',
    'mareo', 'mareado', 'vértigo', 'náusea', 'vómito', 'vomitando',
    'fiebre', 'temperatura', 'calentura', 'está caliente', 'ardiendo en fiebre',
    'crisis', 'ataque', 'ataque epiléptico', 'epilepsia',
    'traumatismo', 'trauma', 'golpe en la cabeza', 'cabeza',
    'intoxicación', 'intoxicado', 'envenenamiento', 'envenenado', 'se intoxicó',
    'mordedura', 'mordió', 'picadura', 'picó', 'serpiente', 'culebra', 'perro',
    'agonizando', 'agonía', 'moribundo', 'muriendo', 'muy mal',
    'socorro', 'ayuda', 'auxilio', 'que alguien ayude', 'necesita ayuda',
    'paciente', 'le dio un mal', 'patatús', 'algo le dio', 'se puso mal',
  ],
  
  'Alcaldía - Infraestructura': [
    // Jerga colombiana para infraestructura vial
    'hueco', 'huecos', 'bache', 'baches', 'hundimiento', 'hundido', 'hundida',
    'vía', 'vías', 'calle', 'calles', 'carrera', 'carreras', 'avenida', 'avenidas',
    'pavimento', 'pavimento malo', 'pavimento dañado', 'asfalto', 'asfalto roto',
    'puente', 'puentes', 'viaducto', 'paso a nivel', 'pontón',
    'calzada', 'calzada rota', 'andén', 'andenes', 'acera', 'aceras', 'sardinel',
    'construcción', 'obra', 'obras', 'reparación', 'reparación vial', 'arreglo',
    'grieta', 'grietas', 'fisura', 'rajadura', 'partido', 'partida',
    'deterioro', 'deteriorado', 'dañado', 'daño', 'daño vial', 'roto', 'rota',
    'carretera', 'carretera mala', 'carretera dañada', 'autopista', 'vía principal',
    'calle rota', 'calle mala', 'calle en mal estado', 'calle destrozada',
    'túnel', 'túneles', 'paso subterráneo', 'paso peatonal',
    'relleno', 'tierra', 'sin pavimentar', 'destapada', 'sin asfaltar',
    'obras públicas', 'infraestructura', 'vialidad',
  ],
  
  'Alcaldía - Servicios Públicos': [
    // Jerga colombiana para servicios públicos
    'alumbrado', 'alumbrado público', 'luminaria', 'luminarias',
    'poste', 'postes', 'poste de luz', 'luz', 'luces',
    'bombilla', 'bombillas', 'bombillo', 'bombillos', 'foco', 'focos',
    'semáforo', 'semáforos', 'pare', 'señal', 'señales',
    'iluminación', 'iluminar', 'oscuro', 'oscuridad', 'no hay luz',
    'parque', 'parques', 'jardín', 'jardines', 'zona verde', 'zonas verdes',
    'arboles', 'árbol', 'plantas', 'césped', 'grama', 'prado',
    'espacio público', 'plaza', 'plazas', 'plazoleta', 'glorieta',
    'ornato', 'ornamentación', 'decoración', 'paisajismo',
    'mobiliario urbano', 'bancas', 'sillas', 'canecas', 'banca',
    'señalización', 'señalización vial', 'señales de tránsito', 'demarcación',
    'paradero', 'paraderos', 'estación', 'parada', 'parada de bus',
    'cancha', 'canchas', 'polideportivo', 'parque infantil', 'juegos',
  ],
  
  'Empresa de Aseo': [
    // Jerga colombiana para aseo y basuras
    'basura', 'basuras', 'residuo', 'residuos', 'desecho', 'desechos',
    'mugre', 'sucio', 'sucia', 'suciedad', 'cochinada', 'cochinero', 'porquería',
    'escombros', 'cascajo', 'ripio', 'desechos de construcción',
    'recolección', 'recolectar', 'recogida', 'recoger basura',
    'contenedor', 'contenedores', 'caneca', 'canecas', 'basurero', 'basureros',
    'limpieza', 'limpiar', 'aseo', 'asear', 'barrido', 'barrer',
    'reciclaje', 'reciclar', 'reciclador', 'recicladores',
    'desperdicios', 'sobras', 'despojos', 'inmundicia',
    'botadero', 'tiradero', 'basurero', 'botado', 'tirado',
    'está sucio', 'está cochino', 'está asqueroso', 'está puercón',
    'mal olor', 'hediondo', 'fétido', 'peste', 'apesta',
    'camión de basura', 'recolector', 'carro del aseo',
    'desaseo', 'falta de aseo', 'contaminación', 'contaminado',
    'bolsa de basura', 'bolsas', 'guacal', 'recipiente',
  ],
  
  'Empresa de Acueducto': [
    // Jerga colombiana para agua y alcantarillado
    'agua', 'el agua', 'tubería', 'tuberías', 'tubos', 'tubo',
    'fuga', 'fugas', 'fuga de agua', 'se sale el agua', 'derrame',
    'alcantarillado', 'alcantarilla', 'alcantarillas', 'cloaca', 'sumidero',
    'desagüe', 'drenaje', 'rejilla', 'reja', 'imbornal',
    'inundación', 'inundado', 'inundada', 'inundaciones',
    'acueducto', 'red de agua', 'servicio de agua',
    'cañería', 'cañerías', 'conducto', 'conductos',
    'goteo', 'goteando', 'gotea', 'chorrea', 'chorreando',
    'riego', 'regado', 'se riega', 'brota agua', 'brotando agua',
    'aguas negras', 'aguas residuales', 'aguas servidas', 'aguas sucias',
    'taponamiento', 'tapado', 'tapada', 'obstruido', 'obstrucción',
    'rebose', 'rebosando', 'se rebosa', 'se desborda', 'desborde',
    'empozamiento', 'empozado', 'pozo', 'charco', 'charcos',
    'encharcamiento', 'encharcado', 'embalse', 'estancado',
    'brote', 'brota', 'brote de agua', 'se sale', 'se revienta',
    'roto', 'rota', 'reventado', 'reventada', 'quebrado',
    'sin agua', 'no hay agua', 'falta agua', 'corte de agua',
    'tubo roto', 'caño roto', 'llave rota', 'válvula',
  ],
  
  'Alcaldía General': []
};

export async function classifyReportWithAI(
  title: string, 
  description: string
): Promise<ClassificationResult> {
  // Simular delay de llamada a API
  await new Promise(resolve => setTimeout(resolve, 800));

  const text = `${title} ${description}`.toLowerCase();
  const titleLower = title.toLowerCase();
  
  let bestMatch = 'Alcaldía General';
  let maxScore = 0;
  let matchedKeywords: string[] = [];

  // Analizar cada entidad
  for (const [entity, keywords] of Object.entries(ENTITY_KEYWORDS)) {
    let score = 0;
    const matched: string[] = [];

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Buscar coincidencias exactas de palabras completas
      const wordBoundaryRegex = new RegExp(`\\b${keywordLower}\\b`, 'g');
      const occurrences = (text.match(wordBoundaryRegex) || []).length;
      
      if (occurrences > 0) {
        // Dar más peso a palabras que aparecen múltiples veces
        score += occurrences * 3;
        matched.push(keyword);
        
        // Bonus extra si la palabra clave aparece en el título
        const titleOccurrences = (titleLower.match(wordBoundaryRegex) || []).length;
        if (titleOccurrences > 0) {
          score += titleOccurrences * 5; // Mucho más peso al título
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = entity;
      matchedKeywords = matched;
    }
  }

  // Calcular confianza basada en número de coincidencias
  let confidence = 50;
  if (maxScore > 0) {
    if (maxScore >= 15) {
      confidence = 98;
    } else if (maxScore >= 10) {
      confidence = 95;
    } else if (maxScore >= 7) {
      confidence = 90;
    } else if (maxScore >= 5) {
      confidence = 85;
    } else if (maxScore >= 3) {
      confidence = 75;
    } else {
      confidence = 65;
    }
  }

  const reasoning = maxScore > 0 
    ? `Se identificaron ${matchedKeywords.length} palabras clave relacionadas con ${bestMatch}: "${matchedKeywords.slice(0, 3).join('", "')}"${matchedKeywords.length > 3 ? ` y ${matchedKeywords.length - 3} más` : ''}`
    : 'No se identificaron palabras clave específicas, asignando a entidad general de Alcaldía';

  return {
    entity: bestMatch,
    confidence,
    reasoning
  };
}

// Función para hacer llamada real a OpenAI (requiere API key)
export async function classifyReportWithOpenAI(
  title: string,
  description: string,
  apiKey?: string
): Promise<ClassificationResult> {
  if (!apiKey) {
    // Si no hay API key, usar el clasificador simulado
    return classifyReportWithAI(title, description);
  }

  // En producción, hacer llamada real a OpenAI
  // const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${apiKey}`
  //   },
  //   body: JSON.stringify({
  //     model: 'gpt-3.5-turbo',
  //     messages: [
  //       {
  //         role: 'system',
  //         content: `Eres un clasificador de reportes ciudadanos. Analiza el título y descripción y determina la entidad responsable. Opciones: ${Object.keys(ENTITY_KEYWORDS).join(', ')}`
  //       },
  //       {
  //         role: 'user',
  //         content: `Título: ${title}\nDescripción: ${description}`
  //       }
  //     ]
  //   })
  // });

  // Por ahora, usar el clasificador simulado
  return classifyReportWithAI(title, description);
}
