import React from 'react';

/**
 * Unica fuente de las etiquetas de producto en toda la tienda.
 *
 * Antes cada carrusel inventaba la suya: "Oferta" fija en todas las tarjetas del
 * carrusel de packs, "Stock Limitado" fija en los favoritos, y en el carrusel del home
 * un benefit_tag del backend que caia siempre al mismo valor por defecto. Por eso el
 * cliente veia la misma etiqueta repetida y desincronizada del catalogo.
 *
 * Regla, igual en todos lados:
 *   - overlay: UNA pildora sobre la imagen, con el beneficio.
 *   - meta:    linea de texto bajo el titulo, con "categoria · tipo".
 *
 * Es una sola pildora sobre la imagen a proposito: tres no caben en una imagen de
 * 176-192px, y por eso el codigo anterior recortaba con max-w-[48%] truncate.
 */
const ProductTags = ({ product, variant = 'overlay', className = '' }) => {
  if (variant === 'overlay') {
    if (!product?.benefit) return null;
    return (
      <span
        className={`absolute top-3 left-3 z-10 max-w-[70%] truncate rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary ${className}`}
      >
        {product.benefit}
      </span>
    );
  }

  const partes = [product?.category, product?.product_type].filter(Boolean);
  if (!partes.length) return null;

  return (
    <span
      className={`block text-[10px] font-bold uppercase tracking-widest text-muted-foreground ${className}`}
    >
      {partes.join(' · ')}
    </span>
  );
};

export default ProductTags;
