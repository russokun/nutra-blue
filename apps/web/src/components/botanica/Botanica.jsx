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

/**
 * Fronda de helecho.
 *
 * La primera version tenia las pinnas rectas, todas al mismo angulo y a intervalos
 * parejos: se veia como un peine, no como una planta. Una fronda real hace tres cosas que
 * ahora estan puestas:
 *
 *   1. Las pinnas se van inclinando hacia la punta. En la base salen casi perpendiculares
 *      al raquis y arriba apuntan casi en su misma direccion. Este es el gesto que mas
 *      delata a un helecho dibujado de memoria.
 *   2. Son curvas, no segmentos. Cada una se arquea hacia el apice.
 *   3. La fronda es mas ancha cerca del primer tercio, no en el arranque: crece rapido,
 *      llega a su maximo y despues se afina hasta la punta.
 *
 * El raquis es una Bezier cuadratica y las pinnas salen de su tangente, asi que si se
 * cambia la curva del tallo las pinnas la siguen solas.
 */
const RAQUIS = { p0: [48, 97], p1: [57, 54], p2: [63, 7] };

const puntoYTangente = (t) => {
  const { p0, p1, p2 } = RAQUIS;
  const u = 1 - t;
  const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
  const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
  const tx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const ty = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  const norma = Math.hypot(tx, ty) || 1;
  return { x, y, tx: tx / norma, ty: ty / norma };
};

const PINNAS = 15;

export const Helecho = ({ className = '', ...props }) => {
  const pinnas = [];
  for (let i = 0; i < PINNAS; i += 1) {
    const t = 0.04 + (i / (PINNAS - 1)) * 0.92;
    const { x, y, tx, ty } = puntoYTangente(t);

    // De 78° en la base a 26° en la punta.
    const angulo = ((78 - t * 52) * Math.PI) / 180;
    // Ancho maximo alrededor del primer tercio, despues se afina.
    const largo = 34 * Math.sin(Math.PI * Math.min(1, t * 0.82 + 0.13)) ** 1.35;

    for (const lado of [-1, 1]) {
      const cos = Math.cos(angulo * lado);
      const sin = Math.sin(angulo * lado);
      // Direccion de la pinna: la tangente del raquis, rotada.
      const dx = tx * cos - ty * sin;
      const dy = tx * sin + ty * cos;
      const fx = x + dx * largo;
      const fy = y + dy * largo;
      // El control se corre hacia el apice, que es lo que arquea la pinna.
      const cx = x + dx * largo * 0.6 + tx * largo * 0.22;
      const cy = y + dy * largo * 0.6 + ty * largo * 0.22;
      pinnas.push(
        <path key={`${i}-${lado}`} d={`M${x.toFixed(1)} ${y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${fx.toFixed(1)} ${fy.toFixed(1)}`} />
      );
    }
  }

  const { p0, p1, p2 } = RAQUIS;
  return (
    <svg {...base} className={className} {...props}>
      <path d={`M${p0[0]} ${p0[1]} Q ${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`} />
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
