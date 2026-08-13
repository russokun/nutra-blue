/**
 * Recuerda con qué correo se hizo cada pedido, para poder volver a ver su confirmación.
 *
 * La API protege `GET /orders/{id}`: en producción exige el correo del comprador, porque
 * sin eso cualquiera podría recorrer identificadores de pedido y leer nombres,
 * direcciones y teléfonos de los clientes. Esa protección se mantiene; lo que faltaba
 * era que el propio comprador pudiera acreditarse.
 *
 * Antes el correo vivía en `sessionStorage` bajo `nutra_blue_pending_order`, y la página
 * de confirmación lo BORRABA apenas cargaba el pedido una vez. Resultado: al volver de
 * Mercado Pago se veía bien, y al recargar un rato después daba 403 "Email is required
 * to access this order". Además `sessionStorage` muere al cerrar la pestaña, así que
 * abrir el enlace de nuevo también fallaba.
 *
 * Acá se guarda en `localStorage`, indexado por pedido: son los pedidos de esa persona
 * en su propio dispositivo.
 */
const CLAVE = 'nutra_blue_order_access';
const MAXIMO = 20;

const leerMapa = () => {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    const mapa = crudo ? JSON.parse(crudo) : {};
    return mapa && typeof mapa === 'object' ? mapa : {};
  } catch {
    return {};
  }
};

/** Se llama al crear el pedido, antes de mandar al comprador a la pasarela. */
export const recordarPedido = (orderId, email) => {
  if (!orderId || !email) return;
  try {
    const mapa = leerMapa();
    mapa[orderId] = email;

    // Se conservan los últimos, para no crecer sin límite en el navegador.
    const claves = Object.keys(mapa);
    if (claves.length > MAXIMO) {
      claves.slice(0, claves.length - MAXIMO).forEach((k) => delete mapa[k]);
    }

    window.localStorage.setItem(CLAVE, JSON.stringify(mapa));
  } catch {
    /* almacenamiento bloqueado: se sigue sin recordar, la confirmación igual se ve
       en el momento porque llega en el estado de la navegación */
  }
};

/** Correo con el que se puede pedir ese pedido, si lo hizo esta persona en este equipo. */
export const emailDePedido = (orderId) => {
  if (!orderId) return '';
  const guardado = leerMapa()[orderId];
  if (guardado) return guardado;

  // Compatibilidad con pedidos hechos antes de este cambio, que solo dejaron el
  // registro de sesión. Se exige que sea del MISMO pedido: si no, se estaría mandando
  // el correo de otra compra y la API respondería "Email does not match".
  try {
    const crudo = window.sessionStorage.getItem('nutra_blue_pending_order');
    const pendiente = crudo ? JSON.parse(crudo) : null;
    if (pendiente && pendiente.orderId === orderId) return pendiente.email || '';
  } catch {
    /* ignorado */
  }

  return '';
};
