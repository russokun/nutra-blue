/**
 * Modo prueba de la tienda.
 *
 * Sirve para que NutraBlue recorra la experiencia de compra completa —catálogo, filtros,
 * carrito, cupón, checkout y pago real— usando productos baratos, sin que un cliente los
 * vea nunca en la tienda normal.
 *
 * Se enciende una sola vez entrando a cualquier página con `?prueba=1` y queda guardado
 * en el navegador, así no hay que acordarse del parámetro al navegar. Mientras está
 * activo se ve una barra arriba con un botón para salir.
 *
 * Los productos de prueba son los que están marcados como ocultos en el panel admin.
 */
const CLAVE = 'nutra_blue_modo_prueba';
const PARAMETRO = 'prueba';
const EVENTO = 'nutrablue:modo-prueba';

const leer = () => {
  try {
    return window.localStorage.getItem(CLAVE) === '1';
  } catch {
    // Navegación privada con almacenamiento bloqueado: se sigue sin modo prueba.
    return false;
  }
};

const escribir = (activo) => {
  try {
    if (activo) window.localStorage.setItem(CLAVE, '1');
    else window.localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento no se puede persistir; el modo dura lo que la página */
  }
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: { activo } }));
};

/**
 * Lee `?prueba=1` (o `?prueba=0` para salir) y lo persiste. Se llama al arrancar la app.
 * Devuelve si el modo quedó activo.
 */
export const sincronizarDesdeUrl = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has(PARAMETRO)) {
      const valor = params.get(PARAMETRO);
      escribir(valor !== '0' && valor !== 'false');
    }
  } catch {
    /* URL rara: se ignora y manda lo que ya estaba guardado */
  }
  return leer();
};

export const modoPruebaActivo = () => leer();

export const salirDelModoPrueba = () => escribir(false);

/** Permite que la barra y las páginas reaccionen sin recargar. */
export const alCambiarModoPrueba = (callback) => {
  const handler = () => callback(leer());
  window.addEventListener(EVENTO, handler);
  return () => window.removeEventListener(EVENTO, handler);
};
