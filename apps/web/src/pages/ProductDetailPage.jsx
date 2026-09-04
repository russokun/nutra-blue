import React, { useState, useEffect } from 'react';
import { Helmet } from '@/components/Meta';
import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, CheckCircle2, ZoomIn } from 'lucide-react';
import dataClient from '@/lib/dataClient';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ProductTags from '@/components/common/ProductTags';
import VisorImagen from '@/components/VisorImagen';
import { Ramita } from '@/components/botanica/Botanica';
import { absoluteUrl, breadcrumbSchema, productSchema } from '@/lib/seo';
import { toast } from 'sonner';
import { getProductExtraDetails } from '@/lib/productExtraDetails';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  // Índice de la foto abierta en el visor; `null` con el visor cerrado. Va acá arriba y
  // no junto a `images`: abajo quedaría después de los `return` de carga y de error, y un
  // hook que solo se ejecuta a veces rompe el orden que React espera entre renders.
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [crossSellProducts, setCrossSellProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const record = await dataClient.collection('products').getOne(id, { $autoCancel: false });
      setProduct(record);

      // Fetch related products from same category
      const related = await dataClient.collection('products').getFullList({
        filter: `category = "${record.category}" && id != "${id}"`,
        sort: '-created',
        $autoCancel: false
      });
      setRelatedProducts(related.slice(0, 3));

      // Venta cruzada: la sección "Recomendaciones con otros productos" de la ficha
      // de Google Docs nombra los productos sugeridos en texto corrido, así que se
      // buscan en el catálogo. Si el producto no tiene ficha, se cae al mapa estático.
      const extra = getProductExtraDetails(record.name);
      const crossSellText = (record.cross_selling || '').toLowerCase();
      const hasStaticMatches = extra.matches && extra.matches.length > 0;

      if (crossSellText || hasStaticMatches) {
        const allProducts = await dataClient.collection('products').getFullList({ $autoCancel: false });
        const matched = allProducts.filter((p) => {
          if (p.id === id) return false;
          const productName = p.name.toLowerCase().trim();
          if (hasStaticMatches && extra.matches.includes(productName)) return true;
          if (!crossSellText) return false;
          // El nombre completo del catálogo ("Maqui Liofilizado (60 g)") rara vez
          // aparece literal en la ficha, que dice "Maqui Berry": se compara por la
          // primera palabra significativa.
          const keyword = productName.split(/\s+/)[0];
          return keyword.length >= 5 && crossSellText.includes(keyword);
        });
        setCrossSellProducts(matched.length > 0 ? matched.slice(0, 2) : related.slice(0, 2));
      } else {
        setCrossSellProducts(related.slice(0, 2));
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('No se pudo cargar el producto. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (product.stock < quantity) {
      toast.error('Stock insuficiente');
      return;
    }
    addToCart(product, quantity);
    toast.success(`${product.name} añadido al carrito`);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Agotado', color: 'text-destructive' };
    if (stock < 10) return { text: `Solo ${stock} disponibles`, color: 'text-amber-600' };
    return { text: `En stock — ${stock} disponibles`, color: 'text-success' };
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <Skeleton className="w-full h-[500px] rounded-2xl" />
              <div className="space-y-6">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 text-center">
              <p className="text-destructive mb-4">{error || 'Producto no encontrado'}</p>
              <Button onClick={() => navigate('/shop')}>Volver al Catálogo</Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const stockStatus = getStockStatus(product.stock);
  const staticDetails = getProductExtraDetails(product.name);
  const extraDetails = {
    origin: product.origin || staticDetails.origin,
    icons: product.benefits && product.benefits.length > 0
      ? product.benefits.map((b) => {
          // Los beneficios importados desde la ficha de Google Docs son texto corrido.
          // Solo se separa el primer token cuando es de verdad un emoji; si no, el
          // beneficio entero es el texto (antes "Diversas investigaciones…" quedaba
          // con "Diversas" renderizado como si fuera el ícono).
          const match = b.match(/^(\p{Extended_Pictographic}️?)\s+(.+)$/u);
          return match ? { emoji: match[1], text: match[2] } : { emoji: "🌱", text: b };
        })
      : staticDetails.icons,
  };
  // Solo se muestran las secciones que tienen datos reales de este producto. Antes se
  // caía a un texto genérico ("Ingredientes naturales puros de la más alta calidad...")
  // que no dice nada del producto: en un suplemento, la dosis y las precauciones son
  // información de seguridad y no se pueden inventar. Las fichas de Google Docs que no
  // traen esas secciones simplemente no las muestran.
  const technicalSections = [
    { key: 'ingredients', label: 'Ingredientes', value: product.ingredients },
    { key: 'usage', label: 'Modo de Uso', value: product.usage },
    { key: 'precautions', label: 'Precauciones', value: product.precautions },
    { key: 'profile', label: 'Perfil del Producto', value: product.product_profile },
  ].filter((s) => s.value && String(s.value).trim());
  // Las fichas traen beneficios en párrafos largos: en ese caso la grilla de 4
  // columnas no da, y se muestran apilados.
  const hasLongBenefits = extraDetails.icons.some((item) => item.text.length > 90);
  const images = product.images?.length ? product.images : [product.image_url];

  return (
    <>
      <Helmet>
        <title>{`${product.name} — NutraBlue | Chile`}</title>
        <meta name="description" content={product.description || `Adquiere ${product.name} con formulación científica premium en NutraBlue.`} />
        <meta property="og:title" content={`${product.name} — NutraBlue`} />
        <meta property="og:description" content={product.description || `Fórmula con adaptógenos de alta biodisponibilidad. Compra ${product.name} en NutraBlue.`} />
        <meta property="og:image" content={product.image_url} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={absoluteUrl(`/product/${product.id}`)} />
        <link rel="canonical" href={absoluteUrl(`/product/${product.id}`)} />
      </Helmet>
      {/* react-helmet ignora los <script> pasados como hijos: hay que usar la prop. */}
      <Helmet
        script={[
          { type: 'application/ld+json', innerHTML: JSON.stringify(productSchema(product)) },
          { type: 'application/ld+json', innerHTML: JSON.stringify(breadcrumbSchema(product)) },
        ]}
      />

      <Header />

      <main className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-md border border-border/40">
              <Carousel className="w-full">
                <CarouselContent className="-ml-0">
                  {images.map((url, index) => (
                    <CarouselItem key={`${url}-${index}`} className="pl-0">
                      {/* Acá la foto va recortada a 450px de alto: de un frasco no se
                          alcanza a leer la etiqueta. El botón abre el visor, que la
                          muestra entera y deja acercarla. */}
                      <button
                        type="button"
                        onClick={() => setFotoAmpliada(index)}
                        aria-label={`Ampliar foto${images.length > 1 ? ` ${index + 1}` : ''} de ${product.name}`}
                        className="group relative block w-full cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <img
                          src={url}
                          alt={`${product.name}${images.length > 1 ? ` — foto ${index + 1}` : ''}`}
                          className="w-full h-[450px] object-cover"
                        />
                        <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition group-hover:bg-black/80">
                          <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" /> Ampliar
                        </span>
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {images.length > 1 && (
                  <>
                    <CarouselPrevious className="left-3" />
                    <CarouselNext className="right-3" />
                  </>
                )}
              </Carousel>
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center">
              <ProductTags product={product} variant="meta" className="mb-2 !text-xs !text-primary" />
              <h1
                className="text-3xl md:text-4xl font-display text-foreground mb-4"
              >
                {product.name}
              </h1>

              <p className="text-3xl font-bold text-foreground mb-3">
                {formatPrice(product.price)}
              </p>

              <p className={`text-sm font-medium mb-6 ${stockStatus.color}`}>
                {stockStatus.text}
              </p>

              {/* Certifications */}
              {product.certifications && product.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {product.certifications.map((cert, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-secondary/80 text-secondary-foreground font-medium py-1 px-2.5">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-success" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              )}

              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {product.description || 'Sin descripción disponible.'}
              </p>

              {/* Quantity Selector */}
              <div className="mb-6 border-t border-border/30 pt-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">Cantidad</span>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="h-9 w-9"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-bold text-foreground w-10 text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                    className="h-9 w-9"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full h-11 text-base font-semibold shadow-md active:scale-[0.98] transition-all duration-150"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.stock === 0 ? 'Agotado' : 'Añadir a mi Rutina'}
              </Button>
            </div>
          </div>

          {/* Banner de la Marca NutraBlue */}
          <div className="w-full bg-gradient-to-r from-sky-950 via-slate-900 to-sky-950 text-white py-6 px-8 rounded-2xl border border-primary/20 shadow-md mb-12 flex flex-col md:flex-row justify-between items-center gap-4 overflow-hidden relative group">
            {/* Left Decorative Shape */}
            <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-primary/5 to-transparent skew-x-12 pointer-events-none"></div>
            {/* Right Decorative Shape */}
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-primary/5 to-transparent -skew-x-12 pointer-events-none"></div>

            {/* Left Logo */}
            <div className="flex items-center space-x-2 shrink-0 z-10 select-none">
              <span className="text-2xl font-display text-white drop-shadow-sm">
                NutraBlue
              </span>
              <Ramita className="h-6 w-6 shrink-0 text-emerald-400" />
            </div>

            {/* Center Brand Statement */}
            <div className="text-center z-10 max-w-md">
              <p className="text-sm md:text-base font-bold tracking-wider text-white uppercase drop-shadow-sm" style={{ letterSpacing: '0.1em' }}>
                Nutrición Consciente y Orgánica
              </p>
              <p className="text-xs text-slate-200 font-medium mt-1">
                Fórmulas puras diseñadas para potenciar tu longevidad y bienestar
              </p>
            </div>

            {/* Right Logo */}
            <div className="flex items-center space-x-2 shrink-0 z-10 select-none">
              <Ramita className="h-6 w-6 shrink-0 text-emerald-400" />
              <span className="text-2xl font-display text-white drop-shadow-sm">
                NutraBlue
              </span>
            </div>
          </div>

          {/* --- SECCIÓN: EL ALMA DEL PRODUCTO --- */}
          <div className="pt-8 pb-16 px-6 md:px-12 rounded-3xl bg-slate-50 border border-border/30 didactic-bg mb-12">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-display text-foreground">
                El Alma del Producto
              </h2>
              <div className="w-16 h-0.5 bg-primary mx-auto mt-3 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (8 columns): Benefits, Origin, Technical Accordion */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* 1. Bloque de Beneficios Clave (Visual) */}
                <div className="bg-card/45 border border-border/40 p-6 rounded-2xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Beneficios Clave</h3>
                  <div className={hasLongBenefits ? 'space-y-3' : 'grid grid-cols-2 md:grid-cols-4 gap-4'}>
                    {extraDetails.icons.map((item, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl bg-background/60 border border-border/20 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 ${
                          hasLongBenefits ? 'flex items-start gap-3 p-4' : 'flex flex-col items-center text-center p-4'
                        }`}
                      >
                        <span className={hasLongBenefits ? 'text-2xl shrink-0' : 'text-3xl mb-2.5'}>{item.emoji}</span>
                        <span className={`font-semibold text-foreground ${hasLongBenefits ? 'text-sm leading-relaxed font-normal text-muted-foreground' : 'text-xs leading-tight'}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Origen y Trazabilidad (Transparencia) */}
                <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-6 rounded-2xl border border-primary/10 flex flex-col md:flex-row gap-4 items-center">
                  <div className="text-4xl bg-background p-3 rounded-xl border border-border/20 shadow-sm">🗺️</div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-1">Origen y Trazabilidad</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{extraDetails.origin}</p>
                  </div>
                </div>

                {/* 3. Acordeón de Detalles Técnicos + Imagen */}
                {technicalSections.length > 0 && (
                <div className="bg-card/40 border border-border/40 p-6 rounded-2xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Especificaciones Técnicas</h3>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    {/* Accordion (7 cols) */}
                    <div className="md:col-span-7">
                      <Accordion type="single" collapsible className="w-full">
                        {technicalSections.map((section, idx) => (
                          <AccordionItem
                            key={section.key}
                            value={section.key}
                            className={idx === technicalSections.length - 1 ? 'border-none' : 'border-b border-border/40'}
                          >
                            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3.5">
                              {section.label}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4 whitespace-pre-line">
                              {section.value}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>

                    {/* Image (5 cols) */}
                    <div className="md:col-span-5 h-[220px] rounded-xl overflow-hidden shadow-sm relative group border border-border/20 bg-background/50">
                      <img 
                        src={product.image_url} 
                        alt={`Detalle de ${product.name}`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none"></div>
                    </div>
                  </div>
                </div>
                )}

              </div>

              {/* Right Column (4 columns): El Match Perfecto (Cross-selling) */}
              <div className="lg:col-span-4 bg-card/60 border border-border/40 p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-1">El Match Perfecto</h3>
                <p className="text-xs text-muted-foreground mb-6">Completa tu rutina natural</p>
                
                <div className="space-y-4">
                  {crossSellProducts.map((p) => (
                    <div 
                      key={p.id} 
                      onClick={() => {
                        navigate(`/product/${p.id}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-primary/40 bg-background/50 hover:bg-background/80 transition-all duration-200 cursor-pointer group"
                    >
                      <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{p.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.category}</p>
                        <p className="text-sm font-bold text-primary mt-1">{formatPrice(p.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-border/40 pt-12">
              <h2
                className="text-2xl md:text-3xl font-display text-foreground mb-8"
              >
                Productos Relacionados
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct.id}
                    onClick={() => {
                      navigate(`/product/${relatedProduct.id}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={relatedProduct.image_url}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-card-foreground mb-2 line-clamp-2">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-xl font-bold text-primary">
                        {formatPrice(relatedProduct.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <VisorImagen
        imagenes={images}
        indiceInicial={fotoAmpliada ?? 0}
        abierto={fotoAmpliada !== null}
        onCerrar={() => setFotoAmpliada(null)}
        nombre={product.name}
      />

      <Footer />
    </>
  );
};

export default ProductDetailPage;