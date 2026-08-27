import React from 'react';

/**
 * Botánica de marca: las formas vegetales que decoran el sitio.
 *
 * Están dibujadas —trazo de 2 unidades sobre un lienzo de 100, todas— y no son emoji.
 * Antes el sitio usaba 🌿 como si fuera un ícono: se ve distinto en cada sistema
 * operativo, no toma el color de la marca y no escala con el resto del dibujo.
 *
 * Todas heredan `currentColor`, así que el color lo decide quien las usa y no hay que
 * duplicar cada forma por cada verde de la paleta.
 *
 * Son decoración: van con `aria-hidden` puesto desde acá, para que nadie tenga que
 * acordarse de ponerlo en cada sitio donde las use.
 */

const base = {
  viewBox: '0 0 100 100',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
};

/** Fronda de helecho: tallo curvo con pinnas que se acortan hacia la punta. */
export const Helecho = ({ className = '', ...props }) => {
  // Las pinnas se generan con una ley simple en vez de escribir cuarenta paths a mano:
  // así el ritmo es parejo y cambiar el largo o la inclinación es un solo número.
  const pinnas = [];
  for (let i = 0; i < 11; i += 1) {
    const t = i / 10;
    const y = 92 - t * 78;
    const x = 50 + Math.sin(t * 1.5) * 9;
    const largo = 30 * (1 - t) ** 0.85 + 3;
    const caida = 7 * (1 - t);
    pinnas.push(
      <path key={`i${i}`} d={`M${x} ${y} Q ${x - largo * 0.55} ${y - caida * 0.3} ${x - largo} ${y - caida}`} />,
      <path key={`d${i}`} d={`M${x} ${y} Q ${x + largo * 0.55} ${y - caida * 0.3} ${x + largo} ${y - caida}`} />
    );
  }
  return (
    <svg {...base} className={className} {...props}>
      <path d="M50 96 Q 52 60 56 32 Q 58 20 59 12" />
      {pinnas}
    </svg>
  );
};

/** Hoja ovalada con nervadura, la forma más neutra de la familia. */
export const Hoja = ({ className = '', ...props }) => (
  <svg {...base} className={className} {...props}>
    <path d="M50 95 Q 50 70 50 52" />
    <path d="M50 52 Q 18 40 24 14 Q 50 10 50 52 Z" />
    <path d="M50 52 Q 82 40 76 14 Q 50 10 50 52 Z" />
    <path d="M50 44 L 36 32 M50 34 L 38 24 M50 44 L 64 32 M50 34 L 62 24" />
  </svg>
);

/** Ramita de hojas alternas: sirve donde una fronda entera sería demasiado. */
export const Ramita = ({ className = '', ...props }) => {
  const hojas = [];
  for (let i = 0; i < 5; i += 1) {
    const y = 84 - i * 15;
    const lado = i % 2 === 0 ? -1 : 1;
    const largo = 22 - i * 2.4;
    hojas.push(
      <path
        key={i}
        d={`M50 ${y} Q ${50 + lado * largo * 0.5} ${y - 9} ${50 + lado * largo} ${y - 11} Q ${50 + lado * largo * 0.45} ${y - 3} 50 ${y} Z`}
      />
    );
  }
  return (
    <svg {...base} className={className} {...props}>
      <path d="M50 96 Q 49 60 50 18" />
      {hojas}
    </svg>
  );
};

/** Flor de cinco pétalos sobre tallo. */
export const Flor = ({ className = '', ...props }) => {
  const petalos = [];
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = 50 + Math.cos(a) * 19;
    const py = 36 + Math.sin(a) * 19;
    const ax = 50 + Math.cos(a - 0.55) * 15;
    const ay = 36 + Math.sin(a - 0.55) * 15;
    const bx = 50 + Math.cos(a + 0.55) * 15;
    const by = 36 + Math.sin(a + 0.55) * 15;
    petalos.push(<path key={i} d={`M50 36 Q ${ax} ${ay} ${px} ${py} Q ${bx} ${by} 50 36 Z`} />);
  }
  return (
    <svg {...base} className={className} {...props}>
      <path d="M50 96 Q 48 74 50 57" />
      <path d="M50 78 Q 36 74 32 62" />
      {petalos}
      <circle cx="50" cy="36" r="5.5" />
    </svg>
  );
};

/** Umbela: el remate seco de una flor, radios desde un punto. */
export const Semilla = ({ className = '', ...props }) => {
  const radios = [];
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    const largo = 22 + (i % 3) * 3;
    radios.push(
      <g key={i}>
        <path d={`M50 40 L ${50 + Math.cos(a) * largo} ${40 + Math.sin(a) * largo}`} />
        <circle cx={50 + Math.cos(a) * largo} cy={40 + Math.sin(a) * largo} r="2.2" />
      </g>
    );
  }
  return (
    <svg {...base} className={className} {...props}>
      <path d="M50 96 Q 52 70 50 46" />
      {radios}
    </svg>
  );
};

export const FORMAS = { Helecho, Hoja, Ramita, Flor, Semilla };
