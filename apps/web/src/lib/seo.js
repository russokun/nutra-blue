/**
 * Datos de SEO compartidos.
 *
 * El dominio vivía escrito a mano en cada página y apuntaba a `nutrablue-test.vercel.app`,
 * o sea que las etiquetas canónicas le decían a Google que la versión oficial del sitio
 * era un deploy de prueba. Acá hay un solo origen para que no vuelva a pasar.
 */
export const SITE_URL = 'https://nutrablue.cl';

export const SITE_NAME = 'NutraBlue';

/** URL absoluta de una ruta, para canonical y Open Graph. */
export const absoluteUrl = (path = '/') => {
  const limpio = String(path || '/').trim();
  return `${SITE_URL}${limpio.startsWith('/') ? limpio : `/${limpio}`}`;
};

export const OG_IMAGE = absoluteUrl('/og-image.png');

export const CONTACTO_EMAIL = 'contacto@nutrablue.cl';

/**
 * Datos estructurados (schema.org). Google los usa para mostrar precio, disponibilidad y
 * migas de pan en los resultados de búsqueda.
 *
 * A propósito NO se declara `aggregateRating`: no tenemos reseñas reales, e inventarlas
 * es motivo de sanción manual de Google además de publicidad engañosa.
 */
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl('/logo.png'),
  description:
    'Empresa familiar chilena que selecciona alimentos naturales y funcionales para la energía, la concentración, el descanso y la longevidad.',
  email: CONTACTO_EMAIL,
  areaServed: { '@type': 'Country', name: 'Chile' },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: CONTACTO_EMAIL,
    availableLanguage: ['Spanish'],
  },
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: 'es-CL',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/shop?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export const productSchema = (product) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description || undefined,
  image: product.image_url ? [product.image_url] : undefined,
  category: product.category || undefined,
  brand: { '@type': 'Brand', name: SITE_NAME },
  offers: {
    '@type': 'Offer',
    url: absoluteUrl(`/product/${product.id}`),
    priceCurrency: 'CLP',
    price: String(product.price ?? ''),
    availability:
      Number(product.stock) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    seller: { '@type': 'Organization', name: SITE_NAME },
  },
});

export const breadcrumbSchema = (product) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Catálogo', item: absoluteUrl('/shop') },
    { '@type': 'ListItem', position: 3, name: product.name, item: absoluteUrl(`/product/${product.id}`) },
  ],
});

export const faqSchema = (preguntas) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: preguntas.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
});
