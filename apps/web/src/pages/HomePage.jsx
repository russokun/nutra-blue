import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Heart, Sparkles, BookOpen, ArrowRight, X, Check, ShoppingBag } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import dataClient from '@/lib/dataClient';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

const HomePage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeArticle, setActiveArticle] = useState(null);

  const pillars = [
    {
      icon: Brain,
      title: 'Potencia tu claridad mental',
      cta: 'Mejorar mi Enfoque',
      description: 'Potencia tu claridad mental, enfoque y memoria con nuestros nootrópicos naturales y adaptógenos seleccionados.',
      category: 'Salud Cognitiva',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop'
    },
    {
      icon: Heart,
      title: 'Equilibra tu sistema nervioso',
      cta: 'Reducir mi Cortisol',
      description: 'Equilibra tu sistema nervioso and reduce el cortisol con extractos botánicos que promueven la calma y resiliencia.',
      category: 'Gestión del Estrés',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop'
    },
    {
      icon: Sparkles,
      title: 'Maximiza tu vitalidad',
      cta: 'Activar mi Longevidad',
      description: 'Activa tus vías de longevidad celular con antioxidantes, polifenoles y compuestos que apoyan el envejecimiento saludable.',
      category: 'Longevidad',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop'
    }
  ];

  const articles = [
    {
      id: 'absorcion-celular',
      title: '¿Por qué la absorción celular es el secreto de la verdadera energía?',
      summary: 'La mitocondria es el motor de tu cuerpo, pero sin la biodisponibilidad adecuada de cofactores, la energía nunca llega a tus células.',
      content: 'Muchos suplementos tradicionales se eliminan sin absorberse. En Nutra Blue nos enfocamos en compuestos de alta biodisponibilidad y extractos estandarizados que maximizan la permeabilidad de la membrana celular. Al combinar adaptógenos activos con cofactores naturales, permitimos que tu mitocondria produzca ATP de forma sostenida y eficiente, eliminando el clásico crash de los estimulantes convencionales.'
    },
    {
      id: 'nutricion-avanzada',
      title: 'El impacto de la nutrición avanzada en tu enfoque mental diario.',
      summary: 'Descubre cómo los nootrópicos naturales y el control del cortisol pueden transformar tu claridad cognitiva.',
      content: 'El cerebro consume el 20% de la energía metabólica. Cuando estás bajo estrés crónico, el cortisol elevado inhibe la plasticidad sináptica, reduciendo tu enfoque. El uso regular de compuestos como la L-teanina, hongos medicinales (Melenas de León y Reishi) y nootrópicos naturales ayuda a modular la respuesta al estrés, potenciando la producción de ondas cerebrales alfa para un estado de calma alerta ideal para el alto rendimiento profesional.'
    }
  ];

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const list = await dataClient.collection('products').getFullList({ limit: 3 });
        setFeaturedProducts(list.slice(0, 3));
      } catch (e) {
        console.error('Failed to load featured products:', e);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  const handlePillarClick = (category) => {
    navigate(`/shop?category=${encodeURIComponent(category)}`);
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} añadido al carrito`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <>
      <Helmet>
        <title>Nutra Blue - Biohacking para la Longevidad</title>
        <meta name="description" content="Suplementos funcionales premium para optimizar tu biología. Descubre nuestros productos de salud cognitiva, gestión del estrés y longevidad." />
      </Helmet>

      <Header />

      <main className="overflow-x-hidden bg-background">
        {/* Hero Section */}
        <section className="relative min-h-[90dvh] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/hero_bg.png"
              alt="Wellness lifestyle background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 bg-gradient-to-b from-transparent via-slate-950/40 to-background" />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
                style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
              >
                La ciencia detrás de tu mejor versión.
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed">
                Desbloquea tu máximo rendimiento. Fórmulas de nutrición avanzada basadas en ciencia para optimizar tu energía, enfoque y longevidad.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto bg-accent text-white hover:bg-accent/90 text-base px-8 py-6 rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98]"
                >
                  <Link to="/shop">Optimizar mi Rutina</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 text-base px-8 py-6 rounded-xl transition-all duration-200 active:scale-[0.98]"
                >
                  <Link to="/impacto">Descubrir la Ciencia</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Carrusel de Confianza (Trust Bar) */}
        <section className="bg-slate-950 border-y border-white/15 py-5 text-white/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-xs md:text-sm font-semibold tracking-wide">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">⚡</span>
                <span>Envío Rápido</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">🛡️</span>
                <span>Calidad Clínica Garantizada</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">🧬</span>
                <span>Nutrición Avanzada</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">📦</span>
                <span>Envío Gratis (Sobre $50.000)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pillars Section */}
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2
                className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4"
                style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}
              >
                Tres Pilares de Optimización
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Nuestros productos están diseñados para apoyar las áreas clave de tu bienestar integral
              </p>
            </motion.div>

            <div className="space-y-20">
              {pillars.map((pillar, index) => {
                const Icon = pillar.icon;
                const isEven = index % 2 === 0;

                return (
                  <motion.div
                    key={pillar.category}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
                  >
                    {/* Image */}
                    <div className={`${isEven ? 'md:order-1' : 'md:order-2'}`}>
                      <div className="relative rounded-2xl overflow-hidden shadow-md group cursor-pointer" onClick={() => handlePillarClick(pillar.category)}>
                        <img
                          src={pillar.image}
                          alt={pillar.title}
                          className="w-full h-[350px] object-cover transition-all duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`${isEven ? 'md:order-2' : 'md:order-1'}`}>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="bg-primary/10 p-3 rounded-xl">
                          <Icon className="h-7 w-7 text-primary" />
                        </div>
                        <h3
                          className="text-2xl md:text-3xl font-semibold text-foreground"
                          style={{ fontFamily: 'Playfair Display, serif' }}
                        >
                          {pillar.title}
                        </h3>
                      </div>
                      <p className="text-base text-muted-foreground leading-relaxed mb-6">
                        {pillar.description}
                      </p>
                      <Button
                        onClick={() => handlePillarClick(pillar.category)}
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                      >
                        {pillar.cta}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section className="py-24 bg-[#f8f7f5] border-y border-border/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-widest mb-4">
                Únete a +2.000 personas optimizando su biología
              </span>
              <h2
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}
              >
                Productos Destacados
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Formulaciones premium de alta biodisponibilidad más buscadas por nuestra comunidad.
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl p-4 border border-border space-y-4">
                    <div className="w-full h-56 bg-muted rounded-xl animate-pulse" />
                    <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                    <div className="h-10 w-full bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {featuredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="overflow-hidden cursor-pointer group flex flex-col hover:-translate-y-2 transition-all duration-300"
                  >
                    {/* Floating Product Image Container */}
                    <div className="relative h-64 flex items-center justify-center bg-transparent">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {product.category}
                      </span>
                      <span className="absolute top-2 right-2 bg-amber-500/10 text-amber-700 border border-amber-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Stock limitado del lote actual
                      </span>
                    </div>

                    {/* Text and Actions */}
                    <div className="pt-6 pb-2 text-center flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xl font-black text-primary">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-5">
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/product/${product.id}`);
                          }}
                          className="w-full text-xs py-4 rounded-xl transition-all duration-200"
                        >
                          Ver Detalles
                        </Button>
                        <Button
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={product.stock === 0}
                          className="w-full text-xs bg-accent text-white hover:bg-accent/90 py-4 rounded-xl transition-all duration-200 shadow-md"
                        >
                          {product.stock === 0 ? 'Agotado' : 'Al Carrito'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Science and Authority Articles Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest mb-4">
                <BookOpen className="h-3.5 w-3.5" /> Ciencia & Respaldo
              </span>
              <h2
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}
              >
                Conocimiento Basado en Ciencia
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                No creemos en falsas promesas. Compartimos información basada en la biología y la medicina de precisión.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="bg-card border border-border hover:border-primary/45 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 shadow-sm"
                >
                  {/* Bioluminescent Cells Thumbnail */}
                  <div className="h-48 overflow-hidden bg-slate-900 relative">
                    <img
                      src="/cells_bg.png"
                      alt="Células Bioluminiscentes"
                      className="w-full h-full object-cover opacity-85 hover:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                  </div>

                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <h3
                        className="text-xl md:text-2xl font-bold text-card-foreground mb-4 leading-tight"
                        style={{ fontFamily: 'Playfair Display, serif' }}
                      >
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-6">
                        {article.summary}
                      </p>
                    </div>
                    <Button
                      onClick={() => setActiveArticle(article)}
                      variant="ghost"
                      className="w-fit text-primary font-bold hover:bg-primary/5 hover:text-primary p-0 flex items-center gap-1 group transition-all duration-200"
                    >
                      Descubre la Ciencia <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-16">
              <Button
                asChild
                size="lg"
                className="bg-accent text-white hover:bg-accent/90 rounded-xl px-8 py-6 text-base shadow-md"
              >
                <Link to="/shop">Optimiza tu Cuerpo Hoy</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Article Detail Modal */}
      <AnimatePresence>
        {activeArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveArticle(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-2xl bg-card border border-border rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[85vh]"
            >
              <button
                onClick={() => setActiveArticle(null)}
                className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
                  <Brain className="h-3 w-3" /> Respaldo Médico
                </span>

                <h3
                  className="text-2xl md:text-3xl font-bold text-foreground leading-tight"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {activeArticle.title}
                </h3>

                <p className="text-lg font-medium text-primary leading-relaxed border-l-4 border-accent pl-4 italic">
                  {activeArticle.summary}
                </p>

                <div className="text-base text-muted-foreground leading-relaxed space-y-4 pt-2">
                  <p>{activeArticle.content}</p>
                  <p>En Nutra Blue, nuestro compromiso es la transparencia. Cada compuesto cuenta con trazabilidad completa, certificaciones de origen y es sometido a un control de calidad estricto para asegurar que tu cuerpo reciba exactamente lo que necesita para su optimización funcional.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-border">
                  <Button
                    onClick={() => {
                      setActiveArticle(null);
                      navigate('/shop');
                    }}
                    className="w-full sm:w-auto bg-accent text-white hover:bg-accent/90 rounded-xl px-6 py-5"
                  >
                    Ver Productos Relacionados
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveArticle(null)}
                    className="w-full sm:w-auto rounded-xl px-6 py-5"
                  >
                    Cerrar Lectura
                  </Button>
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

export default HomePage;
// Force deployment trigger in Vercel staging environment