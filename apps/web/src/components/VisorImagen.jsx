import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

/**
 * Visor de fotos de producto a pantalla completa, con zoom.
 *
 * En la ficha la foto va recortada (`object-cover`) a 450px de alto, así que de un frasco
 * no se alcanza a leer ni la etiqueta. Acá se ve completa (`object-contain`) y se puede
 * acercar.
 *
 * El zoom es por toque/clic y el desplazamiento por arrastre, con eventos de puntero: así
 * funciona igual con mouse, con dedo y con lápiz, sin depender de `hover` —que en un
 * teléfono no existe— ni del pellizco, que dentro de un diálogo modal queda bloqueado.
 */

const ESCALA_ZOOM = 2.5;

const VisorImagen = ({ imagenes = [], indiceInicial = 0, abierto, onCerrar, nombre }) => {
  const [indice, setIndice] = useState(indiceInicial);
  const [acercado, setAcercado] = useState(false);
  const [desplazamiento, setDesplazamiento] = useState({ x: 0, y: 0 });
  const arrastre = useRef(null);
  const contenedor = useRef(null);

  // Cada vez que se abre se vuelve al estado inicial: si no, la segunda apertura hereda el
  // zoom y el encuadre de la anterior y se ve un pedazo de foto sin contexto.
  useEffect(() => {
    if (abierto) {
      setIndice(indiceInicial);
      setAcercado(false);
      setDesplazamiento({ x: 0, y: 0 });
    }
  }, [abierto, indiceInicial]);

  const reencuadrar = useCallback(() => {
    setAcercado(false);
    setDesplazamiento({ x: 0, y: 0 });
  }, []);

  const cambiarFoto = useCallback(
    (paso) => {
      setIndice((i) => (i + paso + imagenes.length) % imagenes.length);
      reencuadrar();
    },
    [imagenes.length, reencuadrar]
  );

  useEffect(() => {
    if (!abierto || imagenes.length < 2) return;
    const alTeclear = (e) => {
      if (e.key === 'ArrowRight') cambiarFoto(1);
      if (e.key === 'ArrowLeft') cambiarFoto(-1);
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto, imagenes.length, cambiarFoto]);

  // El desplazamiento se limita a la mitad del tamaño visible: sin tope se puede arrastrar
  // la foto entera fuera de la pantalla y queda un recuadro negro.
  const limitar = (valor, maximo) => Math.max(-maximo, Math.min(maximo, valor));

  const topes = () => {
    const caja = contenedor.current?.getBoundingClientRect();
    if (!caja) return { x: 0, y: 0 };
    return {
      x: (caja.width * (ESCALA_ZOOM - 1)) / 2,
      y: (caja.height * (ESCALA_ZOOM - 1)) / 2,
    };
  };

  const alPresionar = (e) => {
    if (!acercado) return;
    arrastre.current = {
      x: e.clientX - desplazamiento.x,
      y: e.clientY - desplazamiento.y,
      movido: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const alMover = (e) => {
    if (!arrastre.current) return;
    const max = topes();
    const x = limitar(e.clientX - arrastre.current.x, max.x);
    const y = limitar(e.clientY - arrastre.current.y, max.y);
    // Un arrastre de pocos píxeles es el temblor de la mano al tocar, no una intención de
    // mover: sin este margen, cualquier toque para alejar se interpreta como arrastre.
    if (Math.abs(x - desplazamiento.x) > 3 || Math.abs(y - desplazamiento.y) > 3) {
      arrastre.current.movido = true;
    }
    setDesplazamiento({ x, y });
  };

  const alSoltar = (e) => {
    const hubo = arrastre.current?.movido;
    arrastre.current = null;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (hubo) return; // fue un arrastre, no un toque: no cambiar el zoom
    if (acercado) {
      reencuadrar();
    } else {
      setAcercado(true);
    }
  };

  if (!imagenes.length) return null;

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent
        className="max-w-[100vw] w-screen h-[100dvh] sm:max-w-5xl sm:w-[92vw] sm:h-[88vh] p-0 gap-0 bg-neutral-950 border-none sm:rounded-2xl overflow-hidden"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {nombre ? `Fotos de ${nombre}` : 'Foto del producto'}
        </DialogTitle>

        <div
          ref={contenedor}
          className="relative h-full w-full touch-none select-none overflow-hidden"
        >
          <img
            src={imagenes[indice]}
            alt={`${nombre || 'Producto'}${imagenes.length > 1 ? ` — foto ${indice + 1} de ${imagenes.length}` : ''}`}
            draggable={false}
            onPointerDown={alPresionar}
            onPointerMove={alMover}
            onPointerUp={alSoltar}
            onPointerCancel={alSoltar}
            className={`h-full w-full object-contain transition-transform duration-200 ${
              acercado ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
            }`}
            style={{
              transform: `translate(${desplazamiento.x}px, ${desplazamiento.y}px) scale(${
                acercado ? ESCALA_ZOOM : 1
              })`,
            }}
          />

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="absolute right-3 top-3 rounded-full bg-black/60 p-2.5 text-white backdrop-blur transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => (acercado ? reencuadrar() : setAcercado(true))}
            aria-label={acercado ? 'Alejar' : 'Acercar'}
            className="absolute left-3 top-3 rounded-full bg-black/60 p-2.5 text-white backdrop-blur transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            {acercado ? (
              <ZoomOut className="h-5 w-5" aria-hidden="true" />
            ) : (
              <ZoomIn className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          {imagenes.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => cambiarFoto(-1)}
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white backdrop-blur transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => cambiarFoto(1)}
                aria-label="Foto siguiente"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white backdrop-blur transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>

              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {indice + 1} / {imagenes.length}
              </span>
            </>
          )}

          {!acercado && (
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
              Toca la foto para acercar
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisorImagen;
