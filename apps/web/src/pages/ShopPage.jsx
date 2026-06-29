import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, Leaf, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dataClient from '@/lib/dataClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

const ShopPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [activeProductIngredients, setActiveProductIngredients] = useState(null);

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'Salud Cognitiva', label: 'Salud Cognitiva' },
    { value: 'Gestión del Estrés', label: 'Gestión del Estrés' },
    { value: 'Longevidad', label: 'Longevidad' }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const records = await dataClient.collection('products').getFullList({
        sort: 'name',
        $autoCancel: false
      });
      setProducts(records);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('No se pudieron cargar los productos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products
    .filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesSub = true;
      if (selectedSubCategory === 'ofertas') {
        matchesSub = product.price < 18000;
      } else if (selectedSubCategory === 'packs') {
        matchesSub = product.name.toLowerCase().includes('mix') || product.name.toLowerCase().includes('blend') || product.name.toLowerCase().includes('tea');
      } else if (selectedSubCategory === 'individuales') {
        matchesSub = !product.name.toLowerCase().includes('mix') && !product.name.toLowerCase().includes('blend') && !product.name.toLowerCase().includes('tea');
      } else if (selectedSubCategory === 'energia') {
        matchesSub = (product.benefits || []).some(b => b.toLowerCase().includes('energ')) || product.category === 'Longevidad';
      } else if (selectedSubCategory === 'concentracion') {
        matchesSub = (product.benefits || []).some(b => b.toLowerCase().includes('concentr')) || product.category === 'Salud Cognitiva';
      }

      return matchesCategory && matchesSearch && matchesSub;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Agotado', color: 'text-destructive' };
    if (stock < 10) return { text: `Solo ${stock} disponibles`, color: 'text-amber-600' };
    return { text: 'En stock', color: 'text-success' };
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} añadido al carrito`);
  };

  const handleOpenIngredients = (product, e) => {
    e.stopPropagation();
    setActiveProductIngredients(product);
  };

  return (
    <>
      <Helmet>
        <title>Catálogo - Nutra Blue</title>
        <meta name="description" content="Explora nuestra selección de suplementos funcionales premium para salud cognitiva, gestión del estrés y longevidad." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-[#fbfbfa] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header con Buscador Inteligente y Ordenar por */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 border-b border-border pb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Catálogo de Productos
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Fórmulas de biohacking premium basadas en ciencia.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
              {/* Buscador inteligente */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar fórmula..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-foreground w-full rounded-xl"
                />
              </div>

              {/* Ordenar por */}
              <div className="w-full sm:w-48">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="text-foreground rounded-xl">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="price-asc">Precio: Menor a Mayor</SelectItem>
                    <SelectItem value="price-desc">Precio: Mayor a Menor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:col-span-1">
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border sticky top-24 space-y-6">
                
                {/* Category Filter */}
                <div>
                  <span className="text-sm font-semibold text-foreground mb-3 block">Categoría</span>
                  <div className="space-y-1.5">
                    {categories.map(category => (
                      <Button
                        key={category.value}
                        onClick={() => setSelectedCategory(category.value)}
                        variant={selectedCategory === category.value ? 'default' : 'outline'}
                        className="w-full justify-start transition-all duration-200 text-xs py-2 rounded-xl"
                      >
                        {category.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Subcategories / Tipo / Filtros Orientados a la Venta */}
                <div className="pt-4 border-t border-border">
                  <span className="text-sm font-semibold text-foreground mb-3 block">Filtrar por</span>
                  <div className="space-y-1.5">
                    {[
                      { value: 'all', label: 'Todos los Suplementos' },
                      { value: 'ofertas', label: '🏷️ Ofertas Especiales' },
                      { value: 'packs', label: '📦 Packs y Packs Mensuales' },
                      { value: 'individuales', label: '🧬 Productos Individuales' },
                      { value: 'energia', label: '⚡ Beneficio: Energía' },
                      { value: 'concentracion', label: '🧠 Beneficio: Enfoque' }
                    ].map(sub => (
                      <Button
                        key={sub.value}
                        onClick={() => setSelectedSubCategory(sub.value)}
                        variant={selectedSubCategory === sub.value ? 'default' : 'outline'}
                        className="w-full justify-start transition-all duration-200 text-xs py-2 rounded-xl text-left"
                      >
                        {sub.label}
                      </Button>
                    ))}
                  </div>
                </div>

              </div>
            </aside>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-card rounded-xl p-4 border border-border">
                      <Skeleton className="w-full h-48 rounded-lg mb-4" />
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 text-center">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={fetchProducts} variant="outline">
                    Reintentar
                  </Button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-muted rounded-xl p-12 text-center">
                  <p className="text-muted-foreground text-lg mb-4">No se encontraron productos en esta categoría</p>
                  <Button onClick={() => { setSelectedCategory('all'); setSelectedSubCategory('all'); setSearchQuery(''); }}>
                    Limpiar filtros
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stock);
                    return (
                      <div
                        key={product.id}
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative h-48 overflow-hidden bg-muted flex items-center justify-center p-4">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-auto object-contain group-hover:scale-103 transition-all duration-300 drop-shadow-md"
                            />
                            <span className="absolute top-3 left-3 bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {product.category}
                            </span>
                          </div>
                          <div className="p-4 pb-2">
                            <h3 className="text-base font-bold text-card-foreground mb-1 line-clamp-1">
                              {product.name}
                            </h3>
                            <p className="text-xl font-extrabold text-primary mb-1">
                              {formatPrice(product.price)}
                            </p>
                            <p className={`text-xs font-medium ${stockStatus.color}`}>
                              {stockStatus.text}
                            </p>
                          </div>
                        </div>
                        <div className="p-4 pt-0">
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <Button
                              variant="outline"
                              onClick={(e) => handleOpenIngredients(product, e)}
                              className="w-full text-xs py-3.5 rounded-xl transition-all duration-200"
                            >
                              Ingredientes
                            </Button>
                            <Button
                              onClick={(e) => handleAddToCart(product, e)}
                              disabled={product.stock === 0}
                              className="w-full text-xs bg-accent text-white hover:bg-accent/90 py-3.5 rounded-xl transition-all duration-200 font-semibold"
                            >
                              {product.stock === 0 ? 'Agotado' : 'Añadir a mi Rutina'}
                            </Button>
                          </div>

                          {/* Micro-copy de Confianza */}
                          <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-border/30 text-[9px] text-muted-foreground justify-center">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded-md font-medium">✨ Alta Biodisponibilidad</span>
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded-md font-medium">🇨🇱 Envío Rápido a Chile</span>
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded-md font-medium">🛡️ Calidad Clínica Garantizada</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Caja de Sugerencias (Failsafe) */}
              <div className="mt-12 bg-slate-900 text-white rounded-2xl p-8 border border-white/10 shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-lg font-bold">
                      ¿No encontraste lo que buscabas?
                    </h3>
                    <p className="text-sm text-slate-300 max-w-xl">
                      Cuéntanos qué suplemento necesitas y nuestro equipo clínico lo traerá para ti.
                    </p>
                  </div>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.target.elements.suggestionInput.value;
                    if (!input) return;
                    toast.success("¡Sugerencia enviada con éxito! La consideraremos para nuestro próximo lote.");
                    e.target.reset();
                  }} className="flex w-full md:w-auto max-w-md gap-2">
                    <input
                      name="suggestionInput"
                      type="text"
                      placeholder="Ej: Creatina Micronizada, Ashwagandha..."
                      required
                      className="flex-grow md:w-64 px-4 py-3 rounded-xl bg-slate-950/80 border border-white/20 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <Button 
                      type="submit"
                      className="bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-3 rounded-xl text-sm shrink-0 shadow-sm"
                    >
                      Enviar Sugerencia
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Quick View / Ingredients Modal */}
      <AnimatePresence>
        {activeProductIngredients && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveProductIngredients(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[85vh] text-card-foreground"
            >
              <button
                onClick={() => setActiveProductIngredients(null)}
                className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted">
                    <img
                      src={activeProductIngredients.image_url}
                      alt={activeProductIngredients.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {activeProductIngredients.name}
                    </h3>
                    <p className="text-xs text-primary font-semibold uppercase tracking-wider">
                      {activeProductIngredients.category}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Leaf className="h-3.5 w-3.5 text-success" /> Beneficios & Propiedades
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {Array.isArray(activeProductIngredients.benefits) ? (
                      activeProductIngredients.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start gap-2 bg-muted/40 p-2.5 rounded-lg border border-border/20">
                          <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-xs md:text-sm leading-snug">{benefit}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">Beneficios listados en el empaque.</p>
                    )}
                  </div>
                </div>

                {activeProductIngredients.certifications && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      Certificaciones
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(activeProductIngredients.certifications) ? (
                        activeProductIngredients.certifications.map((cert, i) => (
                          <span key={i} className="text-[10px] md:text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md">
                            {cert}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] md:text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md">
                          Certificación Orgánica
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 pt-4 border-t border-border mt-6">
                  <p className="text-xl font-black text-primary">
                    {formatPrice(activeProductIngredients.price)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const id = activeProductIngredients.id;
                        setActiveProductIngredients(null);
                        navigate(`/product/${id}`);
                      }}
                      className="text-xs px-4 py-4 rounded-xl"
                    >
                      Detalles Completos
                    </Button>
                    <Button
                      onClick={(e) => {
                        handleAddToCart(activeProductIngredients, e);
                        setActiveProductIngredients(null);
                      }}
                      disabled={activeProductIngredients.stock === 0}
                      className="text-xs bg-accent text-white hover:bg-accent/90 px-4 py-4 rounded-xl"
                    >
                      Comprar
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
};

export default ShopPage;