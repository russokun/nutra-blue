/**
 * RUT chileno: validación por módulo 11 y formato mientras se escribe.
 *
 * Esto es para la experiencia de quien completa el formulario —avisar del dedazo antes de
 * mandar, y poner los puntos solo—, no para la seguridad. La validación que manda vive en
 * la API (`app/core/rut.py`), porque el checkout es una llamada HTTP como cualquier otra
 * y nada impide mandarla a mano.
 *
 * Lo que ninguna de las dos hace: confirmar que el RUT EXISTA en el SII o que sea de la
 * empresa que dice el formulario. Valida la forma, no la identidad.
 */

const soloValidos = (valor) => String(valor || '').replace(/[^0-9kK]/g, '').toUpperCase();

const digitoVerificador = (cuerpo) => {
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    suma += Number(cuerpo[i]) * factor;
    // Los factores van 2,3,4,5,6,7 y vuelven a empezar.
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
};

/** ¿Está bien formado y su dígito verificador cuadra? */
export const rutEsValido = (valor) => {
  const limpio = soloValidos(valor);
  // Menos de 7 dígitos de cuerpo no es un RUT chileno vigente; más de 8 tampoco.
  if (limpio.length < 8 || limpio.length > 9) return false;

  const cuerpo = limpio.slice(0, -1);
  const verificador = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;

  return digitoVerificador(cuerpo) === verificador;
};

/**
 * Con puntos y guion, para mostrar mientras se escribe: "12.345.678-5".
 *
 * Se aplica en cada tecla, así que tiene que aguantar un RUT a medio escribir sin
 * estorbar: con menos de dos caracteres devuelve lo que haya, tal cual.
 */
export const formatearRut = (valor) => {
  const limpio = soloValidos(valor);
  if (limpio.length < 2) return limpio;

  const cuerpo = limpio.slice(0, -1);
  const verificador = limpio.slice(-1);
  const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${conPuntos}-${verificador}`;
};

/** Sin puntos y con guion, que es como lo guarda la API. */
export const normalizarRut = (valor) => {
  const limpio = soloValidos(valor);
  if (limpio.length < 2) return limpio;
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
};
