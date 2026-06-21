// Detailed content mapping for "El Alma del Producto" section
// Maps product names to their specific benefits, origin, technical accordion, and cross-selling recommendations.

const productDetailsMap = {
  "calm & focus": {
    origin: "Cultivado en el Valle de Limarí, Región de Coquimbo, Chile. Cosechado a mano por agricultores locales en condiciones ecológicas ideales.",
    icons: [
      { emoji: "🌾", text: "100% Orgánico" },
      { emoji: "🧠", text: "Enfoque Mental" },
      { emoji: "🌱", text: "Vegano" },
      { emoji: "🛡️", text: "Sin Aditivos" }
    ],
    technical: {
      ingredients: "Extracto concentrado de hongo Melena de León (Hericium erinaceus) orgánico (cuerpo fructífero) y polvo concentrado de adaptógenos naturales.",
      usage: "Tomar 2 cápsulas al día, de preferencia por la mañana junto con tu desayuno, café o té para potenciar la concentración a lo largo de la jornada.",
      precautions: "No recomendado para mujeres embarazadas, en período de lactancia, ni para menores de 15 años. Mantener en lugar fresco y seco."
    },
    matches: ["reishi mushroom tea"] // Cross-selling
  },
  "dark cacao": {
    origin: "Granos de cacao criollo orgánicos cultivados de forma sostenible en cooperativas agrícolas de San Martín, en la Amazonía Peruana.",
    icons: [
      { emoji: "🍫", text: "Cacao Ceremonial" },
      { emoji: "⚡", text: "Energía Natural" },
      { emoji: "🤝", text: "Comercio Justo" },
      { emoji: "🤎", text: "100% Cacao Puro" }
    ],
    technical: {
      ingredients: "Granos de cacao 100% orgánicos, fermentados, secados al sol y finamente molidos en frío para preservar sus nutrientes y antioxidantes.",
      usage: "Disolver 1 a 2 cucharadas soperas en agua caliente o leche vegetal. Endulzar a gusto. Perfecto para meditación, rituales o como reemplazo saludable del café.",
      precautions: "Contiene teobromina (estimulante suave). Almacenar en envase cerrado en un lugar oscuro y fresco."
    },
    matches: ["matcha ritual"]
  },
  "spirulina premium powder": {
    origin: "Cultivada en estanques de agua mineral pura de napas subterráneas en el Desierto de Atacama, Chile, con alta radiación solar que potencia sus propiedades.",
    icons: [
      { emoji: "🦠", text: "Proteína Completa" },
      { emoji: "🟢", text: "Superalimento" },
      { emoji: "🛡️", text: "Desintoxicante" },
      { emoji: "🌱", text: "Fácil Absorción" }
    ],
    technical: {
      ingredients: "100% Alga Espirulina (Arthrospira platensis) pura deshidratada y pulverizada, libre de excipientes y pesticidas.",
      usage: "Agregar 1 cucharadita (5g) en batidos verdes, jugos de fruta o espolvorear sobre ensaladas y bowls. Consumir de preferencia por la mañana.",
      precautions: "Personas con fenilcetonuria, gota o problemas de tiroides deben consultar a su médico antes de consumirla."
    },
    matches: ["chlorella premium powder"]
  },
  "chlorella premium powder": {
    origin: "Cultivada en un entorno ecológico protegido de alta radiación solar en la pampa del Tamarugal, norte de Chile.",
    icons: [
      { emoji: "♻️", text: "Clorofila Pura" },
      { emoji: "🧼", text: "Detox Celular" },
      { emoji: "🩺", text: "Apoyo Inmune" },
      { emoji: "🌾", text: "Libre de Gluten" }
    ],
    technical: {
      ingredients: "100% Alga Chlorella de pared celular rota mediante proceso mecánico para garantizar la máxima biodisponibilidad y absorción digestiva.",
      usage: "Mezclar 1 cucharadita (3g a 5g) en agua templada con limón, jugos cítricos o batidos. Se recomienda iniciar con la mitad de la dosis los primeros días.",
      precautions: "Puede producir un aumento transitorio de evacuaciones o gases debido al proceso de desintoxicación. Mantener el envase herméticamente cerrado."
    },
    matches: ["spirulina premium powder"]
  },
  "matcha ritual": {
    origin: "Hojas de té verde Tencha cultivadas a la sombra, cosechadas a mano e importadas directamente de la prefectura histórica de Uji, Kioto, Japón.",
    icons: [
      { emoji: "🍵", text: "Grado Ceremonial" },
      { emoji: "⚡", text: "L-Teanina Activa" },
      { emoji: "🧠", text: "Enfoque Calmo" },
      { emoji: "💚", text: "Antioxidantes" }
    ],
    technical: {
      ingredients: "Té verde Matcha (Camellia sinensis) 100% orgánico de calidad ceremonial premium, molido en piedra de granito.",
      usage: "Agregar 1g (media cucharadita) en un cuenco con agua caliente a 80°C. Batir vigorosamente con batidor de bambú (Chasen) hasta obtener espuma. Ideal para té tradicional o Matcha Latte.",
      precautions: "Contiene cafeína natural. Se aconseja moderar su consumo en personas sensibles a los estimulantes o embarazadas."
    },
    matches: ["dark cacao"]
  },
  "black garlic": {
    origin: "Ajos morados seleccionados sembrados en el Valle de Colchagua, Chile. Madurados lentamente a humedad y temperatura controladas por 90 días.",
    icons: [
      { emoji: "🧄", text: "Madurado 90 Días" },
      { emoji: "❤️", text: "Salud Cardiovascular" },
      { emoji: "🩹", text: "Antioxidante" },
      { emoji: "😋", text: "Sabor Dulce Umami" }
    ],
    technical: {
      ingredients: "Dientes de Ajo Negro entero (Allium sativum) 100% natural, sin aditivos, conservantes ni sal añadida.",
      usage: "Consumir 1 a 2 dientes directamente al día en ayunas como suplemento alimenticio, o utilizarlos para untar, cocinar pastas, carnes o tablas de aperitivo.",
      precautions: "Consultar a su médico si está bajo tratamiento con fármacos anticoagulantes."
    },
    matches: ["walnut & almond mix"]
  },
  "walnut & almond mix": {
    origin: "Nueces Chandler y Almendras Nonpareil cosechadas en huertos sustentables de los valles de la Región Metropolitana, Chile.",
    icons: [
      { emoji: "🌰", text: "Omega 3 y 6" },
      { emoji: "🔋", text: "Grasas Saludables" },
      { emoji: "⚡", text: "Energía Sostenida" },
      { emoji: "🌾", text: "Sin Sal Añadida" }
    ],
    technical: {
      ingredients: "Nueces mariposa orgánicas seleccionadas (50%), almendras enteras tostadas naturalmente sin sal ni aceites añadidos (50%).",
      usage: "Consumir un puñado (aproximadamente 30g) como snack saludable a media mañana o tarde, o añadir directamente a yogures, avena o ensaladas.",
      precautions: "Contiene nueces y almendras. Puede contener trazas de maní u otros frutos secos por procesamiento. Mantener en frasco hermético."
    },
    matches: ["black garlic"]
  },
  "reishi mushroom tea": {
    origin: "Hongos Reishi recolectados de forma sustentable en los bosques nativos de la selva valdiviana, Región de Los Ríos, Chile.",
    icons: [
      { emoji: "🍄", text: "Hongo Reishi Puro" },
      { emoji: "🧘", text: "Calma y Relajación" },
      { emoji: "💤", text: "Sueño Reparador" },
      { emoji: "🛡️", text: "Adaptógeno Natural" }
    ],
    technical: {
      ingredients: "Cuerpo fructífero de Hongo Reishi (Ganoderma lucidum) orgánico, cortado en láminas y deshidratado a baja temperatura.",
      usage: "Hervir 3 a 5 gramos en 1 litro de agua durante 20 a 30 minutos a fuego lento (decocción). Colar y consumir como infusión. Se puede endulzar con miel.",
      precautions: "Posee un sabor amargo característico. No consumir si se padece de problemas de coagulación o antes de una cirugía programada."
    },
    matches: ["calm & focus"]
  },
  "golden turmeric & black pepper blend": {
    origin: "Cúrcuma longa cosechada en campos orgánicos del Valle de Elqui y mezclada con pimienta negra molida del mismo origen.",
    icons: [
      { emoji: "🟡", text: "Cúrcuma + Pimienta" },
      { emoji: "🩹", text: "Antiinflamatorio" },
      { emoji: "🧬", text: "Alta Absorción" },
      { emoji: "🩺", text: "Salud Digestiva" }
    ],
    technical: {
      ingredients: "Cúrcuma orgánica en polvo (95%), Pimienta negra orgánica molida (5%). La piperina de la pimienta aumenta la absorción de la curcumina en un 2000%.",
      usage: "Preparar Golden Milk agregando 1/2 cucharadita de la mezcla en una taza de leche caliente (entera, coco o almendra), añadir 1/2 cucharadita de aceite de coco y miel al gusto.",
      precautions: "Evitar consumos excesivos en caso de padecer cálculos biliares u obstrucción de vías biliares."
    },
    matches: ["maca powder"]
  },
  "maca powder": {
    origin: "Raíces de Maca (Amarilla, Negra y Roja) cultivadas orgánicamente a más de 4.000 metros de altura en la meseta andina de Junín, Perú.",
    icons: [
      { emoji: "🪵", text: "Maca Andina Orgánica" },
      { emoji: "⚡", text: "Vitalidad y Vigor" },
      { emoji: "⚖️", text: "Balance Hormonal" },
      { emoji: "🌱", text: "Energía sin Cafeína" }
    ],
    technical: {
      ingredients: "Maca pura seleccionada deshidratada y micropulverizada de calidad premium.",
      usage: "Añadir 1 cucharadita (5g) en batidos, jugos de fruta, yogur o preparaciones horneadas como panqueques. Ideal para la mañana por su efecto energizante.",
      precautions: "Se aconseja comenzar con dosis bajas. Consumir con precaución en personas con alteraciones tiroideas."
    },
    matches: ["golden turmeric & black pepper blend"]
  },
  "mixed berries powder": {
    origin: "Bayas silvestres del sur de Chile (Maqui de la Araucanía, Murta de Los Lagos y Frambuesa de Maule), liofilizadas en frío.",
    icons: [
      { emoji: "🫐", text: "Antioxidantes Nativos" },
      { emoji: "🩹", text: "Antienvejecimiento" },
      { emoji: "❄️", text: "Liofilizado al Vacío" },
      { emoji: "🧬", text: "Rico en Vitamina C" }
    ],
    technical: {
      ingredients: "Maqui silvestre liofilizado en polvo, Murta silvestre liofilizada en polvo, Frambuesa orgánica liofilizada en polvo.",
      usage: "Añadir 1 a 2 cucharaditas a tus batidos, yogures, granola, repostería fría o disuelto en agua para una bebida refrescante y saludable cargada de antioxidantes.",
      precautions: "Mantener en envase bien cerrado en ambiente fresco y seco. El polvo liofilizado absorbe humedad ambiental rápidamente si queda abierto."
    },
    matches: ["spirulina premium powder"]
  }
};

const defaultDetails = {
  origin: "Producto de origen natural y sustentable, cultivado respetando el medio ambiente y cosechado bajo estándares de comercio justo.",
  icons: [
    { emoji: "🌱", text: "100% Natural" },
    { emoji: "🛡️", text: "Calidad Premium" },
    { emoji: "🤝", text: "Comercio Justo" },
    { emoji: "🌾", text: "Libre de Aditivos" }
  ],
  technical: {
    ingredients: "Ingredientes naturales puros de la más alta calidad, seleccionados y procesados bajo normas sanitarias estrictas.",
    usage: "Consumir diariamente de acuerdo a tus necesidades individuales. Incorporar en tu dieta habitual en batidos, infusiones o preparaciones culinarias.",
    precautions: "Mantener en un lugar fresco, seco y fuera del alcance de los niños. Consultar a su médico ante dudas."
  },
  matches: []
};

export function getProductExtraDetails(productName) {
  if (!productName) return defaultDetails;
  const key = productName.toLowerCase().trim();
  return productDetailsMap[key] || defaultDetails;
}

export { productDetailsMap, defaultDetails };
