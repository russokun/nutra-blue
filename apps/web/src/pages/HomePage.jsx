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
  const [showPopup, setShowPopup] = useState(false);
  const [popupEmail, setPopupEmail] = useState('');

  useEffect(() => {
    const isDismissed = localStorage.getItem('nutra_blue_popup_dismissed');
    if (isDismissed) return;

    // Trigger 1: Timed (10 seconds)
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 10000);

    // Trigger 2: Exit Intent
    const handleMouseLeave = (e) => {
      if (e.clientY < 50) {
        setShowPopup(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handlePopupSubmit = (e) => {
    e.preventDefault();
    if (!popupEmail) return;
    
    const subscribers = JSON.parse(localStorage.getItem('nutra_blue_subscribers') || '[]');
    if (!subscribers.includes(popupEmail)) {
      subscribers.push(popupEmail);
      localStorage.setItem('nutra_blue_subscribers', JSON.stringify(subscribers));
    }
    
    localStorage.setItem('nutra_blue_popup_dismissed', 'true');
    setShowPopup(false);
    toast.success('¡Excelente! Código de 15% de descuento enviado a tu correo.');
  };

  const handleClosePopup = () => {
    localStorage.setItem('nutra_blue_popup_dismissed', 'true');
    setShowPopup(false);
  };

  const pillars = [
    {
      icon: Brain,
      title: 'Energía Sostenida',
      cta: 'Mejorar mi Enfoque',
      description: 'Vence la fatiga sin los bajones del café.',
      category: 'Salud Cognitiva',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop'
    },
    {
      icon: Heart,
      title: 'Enfoque Inquebrantable',
      cta: 'Reducir mi Cortisol',
      description: 'Claridad mental para un mundo lleno de distracciones.',
      category: 'Gestión del Estrés',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop'
    },
    {
      icon: Sparkles,
      title: 'Recuperación Profunda',
      cta: 'Activar mi Longevidad',
      description: 'Descanso reparador para rendir al máximo al día siguiente.',
      category: 'Longevidad',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop'
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
                style={{ letterSpacing: '-0.02em', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
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
        <section className="bg-slate-950 border-y border-white/15 py-4 text-white/90 overflow-hidden relative w-full select-none">
          <div className="w-full">
            <div className="animate-marquee-ltr flex items-center whitespace-nowrap gap-12 text-xs md:text-sm font-semibold tracking-wide py-1">
              
              {/* Copy 1 */}
              <div className="flex items-center gap-12">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span>Envío Rápido</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <span>Calidad Premium (Ingredientes testeados)</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧬</span>
                  <span>Fórmulas de Nutrición Avanzada</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📦</span>
                  <span>Envío Gratis (Sobre $50.000)</span>
                </div>
                <span className="text-white/20">|</span>
              </div>

              {/* Copy 2 */}
              <div className="flex items-center gap-12">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span>Envío Rápido</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <span>Calidad Premium (Ingredientes testeados)</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧬</span>
                  <span>Fórmulas de Nutrición Avanzada</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📦</span>
                  <span>Envío Gratis (Sobre $50.000)</span>
                </div>
                <span className="text-white/20">|</span>
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
                style={{ letterSpacing: '-0.02em' }}
              >
                Tres Pilares de Optimización
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Nuestras formulaciones premium atacan los desafíos clave de la biología humana moderna.
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

        {/* Descubrir Categorías */}
        <section className="py-20 bg-[#f8f7f5] border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Descubrir Categorías
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Explora suplementos especializados para tus metas de biohacking
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Salud Cognitiva',
                  desc: 'Potencia tu memoria, enfoque y claridad mental',
                  image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&h=400&fit=crop',
                  tag: 'Enfoque'
                },
                {
                  name: 'Gestión del Estrés',
                  desc: 'Equilibra tu sistema nervioso y reduce cortisol',
                  image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=600&h=400&fit=crop',
                  tag: 'Calma'
                },
                {
                  name: 'Longevidad',
                  desc: 'Activa tus vías de optimización celular',
                  image: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=600&h=400&fit=crop',
                  tag: 'Celular'
                }
              ].map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.name)}`)}
                  className="relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer group shadow-sm border border-border"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-accent text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {cat.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <h3 className="text-lg font-bold mb-1">{cat.name}</h3>
                    <p className="text-xs text-white/85 line-clamp-1">{cat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Section - Los Más Vendidos (Horizontal Scroll on Mobile) */}
        <section className="py-24 bg-background border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-widest mb-4">
                Únete a +2.000 personas optimizando su biología
              </span>
              <h2
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                style={{ letterSpacing: '-0.02em' }}
              >
                Los Más Vendidos
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Formulaciones premium de alta biodisponibilidad más deseadas por nuestra comunidad.
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
              <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none pb-6 gap-6 md:grid md:grid-cols-3 md:overflow-x-visible">
                {featuredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="min-w-[290px] md:min-w-0 snap-center bg-card rounded-2xl p-6 border border-border hover:border-primary/30 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 shadow-sm cursor-pointer"
                  >
                    <div>
                      {/* Floating Product Image Container */}
                      <div className="relative h-48 flex items-center justify-center bg-transparent mb-4">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-auto object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.08)] group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-0 left-0 bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {product.category}
                        </span>
                        <span className="absolute top-0 right-0 bg-amber-500/10 text-amber-700 border border-amber-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Stock Limitado
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-lg font-black text-primary">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.id}`);
                        }}
                        className="w-full text-xs py-3 rounded-xl transition-all duration-200"
                      >
                        Detalles
                      </Button>
                      <Button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={product.stock === 0}
                        className="w-full text-xs bg-accent text-white hover:bg-accent/90 py-3 rounded-xl transition-all duration-200 shadow-sm"
                      >
                        {product.stock === 0 ? 'Agotado' : 'Añadir'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Lead Magnet Pop-up */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-white/10 rounded-3xl p-8 text-white shadow-2xl overflow-hidden"
            >
              {/* Blur elements */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

              <button
                onClick={handleClosePopup}
                className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent">
                  <Sparkles className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Optimiza tu rendimiento desde hoy
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                    Suscríbete y desbloquea un <strong className="text-accent">15% de descuento</strong> en tu primera compra. Además, recibe nuestras guías de optimización biológica directo en tu bandeja de entrada.
                  </p>
                </div>

                <form onSubmit={handlePopupSubmit} className="space-y-3 max-w-sm mx-auto">
                  <input
                    type="email"
                    required
                    value={popupEmail}
                    onChange={(e) => setPopupEmail(e.target.value)}
                    placeholder="Tu correo electrónico"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/25 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <Button
                    type="submit"
                    className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all duration-200"
                  >
                    Quiero mi descuento y optimizarme
                  </Button>
                </form>

                <p className="text-[10px] text-slate-500">
                  Respetamos tu privacidad. Puedes darte de baja cuando quieras.
                </p>
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