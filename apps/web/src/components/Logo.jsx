import React from 'react';

/**
 * La marca, en un solo lugar.
 *
 * El arte original es un lockup VERTICAL: el círculo arriba y la palabra abajo, ocupando
 * esta última apenas el 9% del alto de la imagen. Metido en una barra horizontal obliga a
 * elegir entre un header enorme (el de antes medía 133px en móvil, con el logo a 108px
 * escritos a mano en el JSX) o una palabra de 9px que no se lee.
 *
 * Acá se usa el mismo arte separado en sus dos piezas —`marca.webp` y `palabra.webp`,
 * recortadas del original— y se recompone en horizontal. La palabra es el recorte real,
 * no texto: escribirla con otra tipografía habría sido una aproximación, y el sitio no
 * carga ninguna serif.
 *
 * El alto lo pone quien lo usa, con clases de Tailwind sobre `className`. Todo lo demás
 * (proporciones entre las piezas, separación, accesibilidad) sale de acá, para que no
 * vuelva a haber medidas sueltas repartidas por las páginas.
 */

// Dimensiones reales de los archivos. Van como atributos `width`/`height` para que el
// navegador reserve el espacio antes de bajar la imagen: sin esto la barra da un salto al
// cargar, que es justo lo que se siente como que el header "tirita".
const MARCA = { w: 176, h: 170 };
const PALABRA = { w: 440, h: 69 };

/**
 * `soloMarca`: `true` deja siempre el círculo solo; `'movil'` esconde la palabra bajo el
 * breakpoint `sm`. Esto último es para barras donde el logo comparte el ancho con otros
 * controles —la de checkout lleva además "Volver al Catálogo" y el sello SSL— y en un
 * teléfono angosto no entran los tres.
 */
const Logo = ({
  className = 'h-10',
  soloMarca = false,
  enFondoOscuro = false,
  prioridad = false,
}) => {
  const carga = prioridad
    ? { loading: 'eager', fetchPriority: 'high' }
    : { loading: 'lazy' };

  const siempreSoloMarca = soloMarca === true;

  // Las dos piezas van con `alt=""` y el nombre lo pone el contenedor: son dos imágenes
  // de una sola marca, así que anunciarlas por separado diría "NutraBlue" dos veces. Y
  // con `soloMarca="movil"` la palabra queda en `display:none`, que el lector de pantalla
  // saltea: si el nombre viviera ahí, en teléfono el logo se quedaría sin nombre.
  const marca = (
    <img
      src="/marca.webp"
      width={MARCA.w}
      height={MARCA.h}
      alt=""
      decoding="async"
      {...carga}
      className="h-full w-auto"
    />
  );

  const contenido = siempreSoloMarca ? (
    marca
  ) : (
    <>
      {marca}
      {/* La palabra al 42% del alto del círculo: en el arte original es el 17%, que en
          horizontal la dejaría como una nota al pie del símbolo en vez de su par. */}
      <img
        src="/palabra.webp"
        width={PALABRA.w}
        height={PALABRA.h}
        alt=""
        decoding="async"
        {...carga}
        className={`h-[42%] w-auto ${soloMarca === 'movil' ? 'hidden sm:block' : ''}`}
      />
    </>
  );

  // `className` va SIEMPRE sobre la fila del logo, nunca sobre la pastilla: así `h-10`
  // significa "el logo mide 10" en los dos casos, y la pastilla crece alrededor.
  const fila = (
    <span
      role="img"
      aria-label="NutraBlue"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {contenido}
    </span>
  );

  if (enFondoOscuro) {
    // El logo es azul marino y el footer también: a color se apaga, y el filtro que había
    // antes (`brightness-0 invert`) pintaba de negro TODO el arte y lo invertía a blanco,
    // así que el círculo azul y las hojas blancas terminaban siendo la misma mancha lisa.
    // La pastilla blanca conserva los colores de marca y el arte se lee entero.
    return (
      <span className="inline-flex rounded-2xl bg-white px-3 py-2">{fila}</span>
    );
  }

  return fila;
};

export default Logo;
