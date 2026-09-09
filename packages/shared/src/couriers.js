export const COURIERS = {
  starken: {
    id: 'starken',
    name: 'Starken',
    color: '#e11d48',
    getTrackingUrl: (code) =>
      code ? `https://www.starken.cl/seguimiento?codigo=${encodeURIComponent(code.trim())}` : 'https://www.starken.cl/seguimiento',
  },
  chilexpress: {
    id: 'chilexpress',
    name: 'Chilexpress',
    color: '#eab308',
    getTrackingUrl: (code) =>
      code ? `https://www.chilexpress.cl/tracking-envio?ot=${encodeURIComponent(code.trim())}` : 'https://www.chilexpress.cl/tracking-envio',
  },
  blue_express: {
    id: 'blue_express',
    name: 'Blue Express',
    color: '#2563eb',
    getTrackingUrl: (code) =>
      code ? `https://www.bluex.cl/seguimiento/?tracking=${encodeURIComponent(code.trim())}` : 'https://www.bluex.cl/seguimiento/',
  },
  correos_chile: {
    id: 'correos_chile',
    name: 'Correos de Chile',
    color: '#dc2626',
    getTrackingUrl: (code) =>
      code ? `https://www.correos.cl/seguimiento-en-linea?envio=${encodeURIComponent(code.trim())}` : 'https://www.correos.cl/seguimiento-en-linea',
  },
  pullman: {
    id: 'pullman',
    name: 'Pullman Cargo',
    color: '#0284c7',
    getTrackingUrl: () => 'https://www.pullmancargo.cl/',
  },
};

export const COURIER_LABELS = {
  starken: 'Starken',
  chilexpress: 'Chilexpress',
  blue_express: 'Blue Express',
  correos_chile: 'Correos de Chile',
  pullman: 'Pullman Cargo',
};

export const getCourierName = (courierId) => {
  if (!courierId) return 'Courier no asignado';
  const clean = String(courierId).toLowerCase().trim();
  return COURIER_LABELS[clean] || courierId;
};

export const getTrackingUrl = (courierId, trackingCode) => {
  if (!courierId) return null;
  const clean = String(courierId).toLowerCase().trim();
  const courier = COURIERS[clean];
  if (courier && courier.getTrackingUrl) {
    return courier.getTrackingUrl(trackingCode);
  }
  return null;
};
