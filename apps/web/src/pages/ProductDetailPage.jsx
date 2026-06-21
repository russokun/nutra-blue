import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, CheckCircle2 } from 'lucide-react';
import dataClient from '@/lib/dataClient';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getProductExtraDetails } from '@/lib/productExtraDetails';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
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

      // Fetch cross-sell matches
      const extra = getProductExtraDetails(record.name);
      if (extra.matches && extra.matches.length > 0) {
        const allProducts = await dataClient.collection('products').getFullList({ $autoCancel: false });
        const matched = allProducts.filter(p => 
          extra.matches.includes(p.name.toLowerCase().trim()) && p.id !== id
        );
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
    return { text: 'En stock', color: 'text-success' };
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
  const extraDetails = getProductExtraDetails(product.name);

  return (
    <>
      <Helmet>
        <title>{`${product.name} - Nutra Blue`}</title>
        <meta name="description" content={product.description || `Compra ${product.name} en Nutra Blue`} />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-md border border-border/40">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-[450px] object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center">
              <span className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">
                {product.category}
              </span>
              <h1
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}
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
                {product.stock === 0 ? 'Agotado' : 'Añadir al Carrito'}
              </Button>
            </div>
          </div>

          {/* Banner de la Marca Nutra Blue */}
          <div className="w-full bg-gradient-to-r from-sky-950 via-slate-900 to-sky-950 text-foreground py-6 px-8 rounded-2xl border border-primary/20 shadow-md mb-12 flex flex-col md:flex-row justify-between items-center gap-4 overflow-hidden relative group">
            {/* Left Decorative Shape */}
            <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-primary/5 to-transparent skew-x-12 pointer-events-none"></div>
            {/* Right Decorative Shape */}
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-primary/5 to-transparent -skew-x-12 pointer-events-none"></div>

            {/* Left Logo */}
            <div className="flex items-center space-x-2 shrink-0 z-10 select-none">
              <span className="text-2xl font-semibold text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
                Nutra Blue
              </span>
              <span className="text-lg text-emerald-500 font-bold">🌿</span>
            </div>

            {/* Center Brand Statement */}
            <div className="text-center z-10 max-w-md">
              <p className="text-sm md:text-base font-medium tracking-wide text-foreground/90 uppercase" style={{ letterSpacing: '0.1em' }}>
                Nutrición Consciente y Orgánica
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Fórmulas puras diseñadas para potenciar tu longevidad y bienestar
              </p>
            </div>

            {/* Right Logo */}
            <div className="flex items-center space-x-2 shrink-0 z-10 select-none">
              <span className="text-lg text-emerald-500 font-bold">🌿</span>
              <span className="text-2xl font-semibold text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
                Nutra Blue
              </span>
            </div>
          </div>

          {/* --- SECCIÓN: EL ALMA DEL PRODUCTO --- */}
          <div className="pt-4 pb-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {extraDetails.icons.map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center p-4 rounded-xl bg-background/60 border border-border/20 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20">
                        <span className="text-3xl mb-2.5">{item.emoji}</span>
                        <span className="text-xs font-semibold text-foreground leading-tight">{item.text}</span>
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
                <div className="bg-card/40 border border-border/40 p-6 rounded-2xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Especificaciones Técnicas</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    {/* Accordion (7 cols) */}
                    <div className="md:col-span-7">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="ingredients" className="border-b border-border/40">
                          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3.5">Ingredientes</AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                            {extraDetails.technical.ingredients}
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="usage" className="border-b border-border/40">
                          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3.5">Modo de Uso</AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                            {extraDetails.technical.usage}
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="precautions" className="border-none">
                          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3.5">Precauciones</AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                            {extraDetails.technical.precautions}
                          </AccordionContent>
                        </AccordionItem>
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

              </div>

              {/* Right Column (4 columns): El Match Perfecto (Cross-selling) */}
              <div className="lg:col-span-4 bg-card/60 border border-border/40 p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>El Match Perfecto</h3>
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
                className="text-2xl md:text-3xl font-bold text-foreground mb-8"
                style={{ fontFamily: 'Playfair Display, serif' }}
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

      <Footer />
    </>
  );
};

export default ProductDetailPage;