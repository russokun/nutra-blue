import React, { useEffect, useRef } from 'react';
import { Helecho, Hoja, Ramita, Flor, Semilla } from './Botanica';

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

// Posición, forma, tamaño y cuánto responde al scroll. Las de `factor` alto se mueven
// más, que es lo que da la sensación de profundidad.
const PIEZAS = [
  { Forma: Helecho, clase: 'left-[-3%] top-[6%] w-28 sm:w-40 lg:w-56', giro: -18, factor: 0.10, opacidad: 'text-natural-300/45' },
  { Forma: Ramita,  clase: 'right-[-2%] top-[18%] w-20 sm:w-28 lg:w-36', giro: 24, factor: -0.16, opacidad: 'text-natural-400/40' },
  { Forma: Hoja,    clase: 'left-[4%] top-[46%] w-14 sm:w-20 lg:w-24', giro: 40, factor: -0.09, opacidad: 'text-natural-300/40' },
  { Forma: Flor,    clase: 'right-[6%] top-[58%] w-16 sm:w-20 lg:w-28', giro: -12, factor: 0.13, opacidad: 'text-natural-400/35' },
  { Forma: Semilla, clase: 'left-[-1%] top-[74%] w-16 sm:w-24 lg:w-32', giro: 8, factor: 0.07, opacidad: 'text-natural-300/35' },
  { Forma: Helecho, clase: 'right-[-4%] top-[86%] w-24 sm:w-32 lg:w-44', giro: 165, factor: -0.11, opacidad: 'text-natural-300/40' },
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
