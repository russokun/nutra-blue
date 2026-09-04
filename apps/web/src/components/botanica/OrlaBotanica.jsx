import React, { useEffect, useRef } from 'react';
import { Helecho, Ramita } from './Botanica';

/**
 * Orla botánica: la capa vegetal que enmarca la página y se mece al scrollear.
 *
 * Es UN solo gesto, no una animación por sección. Las formas están siempre visibles y el
 * scroll únicamente las desplaza y las gira un poco, cada una a su ritmo. La diferencia
 * importa: una entrada con `opacity: 0` que se revela al llegar deja la página vacía si el
 * JavaScript falla o si alguien llega con un enlace a media página, y repetida en cada
 * sección se vuelve un carrusel de apariciones. Acá el estado por defecto ya es el bueno.
 *
 * Rinde barato: se escribe UNA variable CSS por cuadro sobre el contenedor, y cada forma
 * la multiplica por lo suyo desde su propio estilo. Un `transform` por elemento y por
 * cuadro los calcula el compositor, no React.
 *
 * Con `prefers-reduced-motion` no se engancha nada al scroll y las formas se quedan
 * quietas donde están: para quien marea el movimiento, esto es exactamente el tipo de
 * deriva de fondo que lo provoca.
 */

// Tres masas grandes, no una lluvia de dibujitos.
//
// La primera version tenia seis piezas chicas repartidas por los margenes al 35-45% de
// opacidad, y se leia como stickers pegados: la pagina quedaba espolvoreada en vez de
// enmarcada. La correccion no fue subir la opacidad ni sumar piezas --eso deja lo mismo,
// mas fuerte-- sino cambiar la escala.
//
// Ahora son tres frondas de hasta 40rem que entran A SANGRE por los bordes, cortadas: se
// ve un tercio de cada una, como una planta que asoma dentro del encuadre. A este tamano
// la presencia la da la escala y la opacidad puede bajar todavia mas, que es lo que las
// mantiene como atmosfera y no como contenido peleandole al catalogo.
//
// Una sola familia de forma, repetida y espejada, en vez de cinco formas distintas: la
// decision es el tamano, y mezclar vocabulario la diluiria.
const PIEZAS = [
  {
    Forma: Helecho,
    clase: 'left-[-16%] top-[-10%] w-[22rem] sm:w-[30rem] lg:w-[40rem]',
    giro: -14,
    factor: 0.06,
    opacidad: 'text-natural-400/25',
  },
  {
    Forma: Helecho,
    // Girada 168° entra desde arriba a la derecha, colgando hacia adentro.
    clase: 'right-[-18%] top-[26%] w-[20rem] sm:w-[28rem] lg:w-[38rem]',
    giro: 168,
    factor: -0.09,
    opacidad: 'text-natural-400/20',
  },
  {
    Forma: Ramita,
    clase: 'left-[-6%] bottom-[-14%] w-[13rem] sm:w-[18rem] lg:w-[24rem]',
    giro: 18,
    factor: 0.045,
    opacidad: 'text-natural-400/25',
  },
];

const OrlaBotanica = () => {
  const capa = useRef(null);

  useEffect(() => {
    const nodo = capa.current;
    if (!nodo) return;

    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (sinMovimiento.matches) return;

    let pendiente = false;
    const alScrollear = () => {
      if (pendiente) return;
      pendiente = true;
      // Un cuadro por scroll, no uno por evento: el navegador dispara `scroll` muchas
      // más veces de las que puede dibujar.
      window.requestAnimationFrame(() => {
        nodo.style.setProperty('--scroll', String(window.scrollY));
        pendiente = false;
      });
    };

    alScrollear();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, []);

  return (
    <div
      ref={capa}
      aria-hidden="true"
      // `fixed` y no `absolute`: la orla acompaña toda la lectura en vez de quedarse
      // pegada al alto de una sección. `overflow-clip` corta lo que asoma por los bordes
      // sin crear barra de scroll horizontal, que es lo que pasaría con `hidden` sobre un
      // elemento fijo.
      className="pointer-events-none fixed inset-0 z-0 select-none overflow-clip [--scroll:0]"
    >
      {PIEZAS.map(({ Forma, clase, giro, factor, opacidad }, i) => (
        <span
          key={i}
          className={`absolute block ${clase} ${opacidad}`}
          style={{
            // `calc` sobre la variable: el desplazamiento y el giro salen del mismo
            // número que se escribió una sola vez arriba.
            transform: `translate3d(0, calc(var(--scroll) * ${factor} * 1px), 0) rotate(calc(${giro}deg + var(--scroll) * ${factor * 0.05} * 1deg))`,
            willChange: 'transform',
          }}
        >
          <Forma className="h-auto w-full" />
        </span>
      ))}
    </div>
  );
};

export default OrlaBotanica;
