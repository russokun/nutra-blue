import React, { useState, useEffect } from 'react';
import { FlaskConical, X } from 'lucide-react';
import { modoPruebaActivo, salirDelModoPrueba, alCambiarModoPrueba } from '@/lib/testMode';

/**
 * Barra fija que avisa que la tienda está en modo prueba.
 *
 * Existe para que nadie confunda un producto de prueba con uno real ni crea que un
 * precio de $1.000 es el de catálogo. Es imposible de ignorar a propósito.
 */
const TestModeBanner = () => {
  const [activo, setActivo] = useState(modoPruebaActivo);

  useEffect(() => alCambiarModoPrueba(setActivo), []);

  if (!activo) return null;

  const salir = () => {
    salirDelModoPrueba();
    // Recarga para que el catálogo vuelva a pedir los productos sin los ocultos.
    window.location.href = '/';
  };

  return (
    <div className="sticky top-0 z-[60] bg-amber-500 text-amber-950">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center">
        <span className="flex items-center gap-2 text-sm font-bold">
          <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
          Modo prueba activo
        </span>
        <span className="text-xs">
          Estás viendo también los productos de prueba. Los pagos son reales.
        </span>
        <button
          onClick={salir}
          className="inline-flex items-center gap-1 rounded-full bg-amber-950/10 px-3 py-1 text-xs font-semibold hover:bg-amber-950/20 transition-colors"
        >
          <X className="h-3 w-3" aria-hidden="true" />
          Salir del modo prueba
        </button>
      </div>
    </div>
  );
};

export default TestModeBanner;
