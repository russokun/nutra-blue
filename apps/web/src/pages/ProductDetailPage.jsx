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

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-[500px] object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <h1
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}
              >
                {product.name}
              </h1>

              <p className="text-3xl font-bold text-primary mb-4">
                {formatPrice(product.price)}
              </p>

              <p className={`text-sm font-medium mb-6 ${stockStatus.color}`}>
                {stockStatus.text}
              </p>

              {/* Certifications */}
              {product.certifications && product.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {product.certifications.map((cert, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Description Accordion */}
              <Accordion type="single" collapsible className="mb-6">
                <AccordionItem value="description">
                  <AccordionTrigger className="text-lg font-semibold">Descripción</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {product.description || 'Sin descripción disponible.'}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Benefits */}
              {product.benefits && product.benefits.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Beneficios</h3>
                  <ul className="space-y-2">
                    {product.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-success mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-6">
                <span className="text-sm font-medium text-foreground mb-3 block">Cantidad</span>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl font-semibold text-foreground w-12 text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
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
                className="w-full transition-all duration-200 active:scale-[0.98]"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.stock === 0 ? 'Agotado' : 'Añadir al Carrito'}
              </Button>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
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
                    onClick={() => navigate(`/product/${relatedProduct.id}`)}
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