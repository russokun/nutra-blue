import React from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { ShoppingBag, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductTags from '@/components/common/ProductTags';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const SectionCarousel = ({ products }) => {
  const { addToCart } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // OJO: este precio "antes" es inventado (el precio actual + 25%). No corresponde a un
  // precio al que el producto se haya vendido nunca, porque no hay columna de descuento
  // en la planilla. Mostrar un precio de referencia fabricado junto a un "Ahorras $X" es
  // publicidad engañosa y expone a NutraBlue ante el SERNAC.
  //
  // Queda pendiente de decisión del cliente: o se agrega una columna de precio anterior
  // real a la planilla, o esta sección deja de mostrar descuentos.
  const getFakeOriginalPrice = (price) => {
    const raw = price * 1.25;
    return Math.round(raw / 100) * 100;
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No hay ofertas o packs disponibles en este momento.
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden px-1">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true, dynamicBullets: true }}
        navigation={true}
        spaceBetween={24}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
          1280: { slidesPerView: 4 }
        }}
        className="offers-swiper pb-14"
      >
        {products.map((product) => {
          const originalPrice = getFakeOriginalPrice(product.price);

          return (
            <SwiperSlide key={product.id} className="h-auto">
              <div className="bg-card border border-border/60 rounded-2xl p-5 hover:border-primary/20 flex flex-col justify-between h-full min-h-[460px] relative group transition-all duration-300 hover:shadow-lg">
                
                <ProductTags product={product} variant="overlay" />

                <Link to={`/product/${product.id}`} className="block flex-grow flex flex-col text-left h-full">
                  {/* Image Container */}
                  <div className="relative w-full h-44 flex items-center justify-center bg-muted/30 rounded-xl overflow-hidden mb-4 group-hover:bg-muted/50 transition-colors duration-300">
                    <img
                      src={product.image_url || "/logo.png"}
                      alt={product.name}
                      loading="lazy"
                      className="max-h-36 object-contain transition-transform duration-500 group-hover:scale-105"
                      style={{ width: 'auto', height: '144px' }}
                    />
                  </div>

                  {/* Card Body */}
                  <div className="space-y-2 flex-grow flex flex-col justify-between">
                    <div>
                      <ProductTags product={product} variant="meta" className="mb-1" />
                      <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {product.name}
                      </h3>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(originalPrice)}
                        </span>
                        <span className="text-lg font-black text-destructive">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">
                        Ahorras {formatPrice(originalPrice - product.price)}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Double Buttons Footer */}
                <div className="mt-4 flex flex-col gap-2 relative z-10">
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 border-primary/20 text-primary hover:bg-primary/5 font-semibold py-2 rounded-xl transition-all duration-200 text-xs"
                  >
                    <Link to={`/product/${product.id}`}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Ver Detalles
                    </Link>
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addToCart(product, 1);
                      toast.success(`¡${product.name} agregado al carrito!`);
                    }}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-xl transition-all duration-200 text-xs"
                  >
                    <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Añadir a mi Rutina
                  </Button>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};

export default SectionCarousel;
