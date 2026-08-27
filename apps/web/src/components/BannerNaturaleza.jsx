import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Banner de cierre del inicio, con temática de pasto y naturaleza.
 *
 * Todo es CSS y SVG: ni una fotografía. Así no depende de una imagen que haya que
 * licenciar ni de un archivo pesado que baje cada visita, se ve nítido en cualquier
 * densidad de pantalla, y el texto encima se lee siempre —sobre una foto de pasto real,
 * el contraste cambia según qué parte de la foto quede detrás de cada letra al cambiar el
 * ancho de la pantalla.
 *
 * Las capas de pasto van en `aria-hidden`: son decoración, y anunciarlas solo agrega
 * ruido a quien navega con lector de pantalla.
 */

// Tres capas del mismo perfil a distintas alturas y opacidades. La sensación de
// profundidad sale de eso, no de dibujar cada brizna.
const CAPAS = [
  { d: 'M0,120 C60,70 90,100 140,60 C170,95 200,55 240,90 C280,50 310,95 360,65 C400,100 440,60 480,95 C520,55 560,100 600,70 L600,140 L0,140 Z', opacidad: 0.25, y: 8 },
  { d: 'M0,120 C50,85 100,110 150,75 C190,105 230,70 270,100 C310,65 350,105 390,80 C430,110 470,75 510,105 C545,80 575,110 600,90 L600,140 L0,140 Z', opacidad: 0.45, y: 4 },
  { d: 'M0,128 C40,105 80,125 120,100 C160,122 200,98 240,118 C280,95 320,120 360,102 C400,124 440,100 480,120 C520,100 560,122 600,108 L600,140 L0,140 Z', opacidad: 1, y: 0 },
];

const BannerNaturaleza = () => (
  <section className="relative isolate overflow-hidden bg-gradient-to-br from-natural-700 via-natural-800 to-natural-900">
    {/* Claro difuso arriba a la izquierda, como luz entrando en el campo. */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-natural-400/25 blur-3xl"
    />

    <div className="relative z-10 mx-auto max-w-5xl px-6 pb-32 pt-16 text-center sm:px-8 sm:pb-40 sm:pt-20">
      <h2 className="font-display text-3xl leading-tight text-white sm:text-4xl md:text-5xl">
        Alimentos que crecen como corresponde
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-natural-100 sm:text-base">
        Trabajamos con productores chilenos que cultivan sin apuro y cosechan a mano.
        Nada de atajos: solo alimento real, del suelo a tu cocina.
      </p>

      <Link
        to="/shop"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-natural-800 shadow-lg transition hover:bg-natural-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Conocer el catálogo
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>

    {/* Pasto. `preserveAspectRatio="none"` deja que se estire a lo ancho sin recortarse:
        es una silueta, no una figura que necesite mantener su proporción. */}
    <svg
      aria-hidden="true"
      viewBox="0 0 600 140"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full sm:h-32"
    >
      {CAPAS.map((capa, i) => (
        <path
          key={i}
          d={capa.d}
          transform={`translate(0, ${capa.y})`}
          className="fill-natural-400"
          opacity={capa.opacidad}
        />
      ))}
    </svg>
  </section>
);

export default BannerNaturaleza;
