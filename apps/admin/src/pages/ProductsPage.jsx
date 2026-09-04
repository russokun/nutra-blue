import React, { useState, useEffect } from 'react';
import adminClient from '@/lib/adminClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Tag, 
  RefreshCw, 
  Upload, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  CloudDownload,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  EyeOff,
  Link as LinkIcon,
  Sparkles
} from 'lucide-react';

const emptyProduct = {
  name: '', 
  price: '', 
  stock: '', 
  category: '', 
  benefit: '', 
  product_type: '', 
  is_hidden: false, 
  images: [],
  google_doc_url: '',
  benefits: [],
  certifications: [],
  docFields: {}
};

const FALLBACK_CATEGORIES = ['Energía', 'Concentración y Calma', 'Descanso y Longevidad', 'Alimentación Diaria'];

const formatPrice = (price) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);

// Helper para renderizar imágenes de forma segura con fallback visual
const SafeProductImage = ({ src, alt, className, fallbackSize = 'h-5 w-5' }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (!src || imgError) {
    return (
      <div className={`bg-muted/60 border border-border/80 rounded-xl flex items-center justify-center text-muted-foreground/60 ${className}`}>
        <Tag className={fallbackSize} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Producto'}
      onError={() => setImgError(true)}
      className={`${className} object-cover`}
    />
  );
};

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [syncing, setSyncing] = useState(false);

  const categories = React.useMemo(() => {
    const fromCatalog = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
    return fromCatalog.length ? fromCatalog : FALLBACK_CATEGORIES;
  }, [products]);

  const benefitOptions = React.useMemo(
    () => [...new Set(products.map((p) => p.benefit).filter(Boolean))].sort(),
    [products]
  );
  
  const typeOptions = React.useMemo(
    () => [...new Set(products.map((p) => p.product_type).filter(Boolean))].sort(),
    [products]
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await adminClient.getProducts();
      setProducts(data);
    } catch (err) {
      toast.error(err.message || 'Error al obtener productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await adminClient.startCatalogSync();
      toast.info('Sincronizando con la planilla. Esto puede tardar unos momentos...');

      while (true) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const status = await adminClient.getCatalogSyncStatus();
        if (status.running) continue;

        if (status.error) {
          toast.error(`La sincronización falló: ${status.error}`);
        } else if (status.summary) {
          const { created, updated, errors, warnings } = status.summary;
          toast.success(`Catálogo sincronizado: ${created + updated} productos actualizados.`);
          if (errors?.length) {
            toast.error(`${errors.length} producto(s) con error: ${errors[0].product} — ${errors[0].error}`);
          }
          if (warnings?.length) {
            warnings.slice(0, 3).forEach((w) => toast.warning(w.error));
          }
        }
        break;
      }
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Error al sincronizar el catálogo');
    } finally {
      setSyncing(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyProduct);
    setShowUrlInput(false);
    setUrlInputValue('');
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? ''),
      category: product.category || '',
      benefit: product.benefit || '',
      product_type: product.product_type || '',
      is_hidden: Boolean(product.is_hidden),
      images: product.images?.length ? product.images : (product.image_url ? [product.image_url] : []),
      google_doc_url: product.google_doc_url || '',
      benefits: product.benefits || [],
      certifications: product.certifications || [],
      docFields: {
        description: product.description,
        origin: product.origin,
        ingredients: product.ingredients,
        usage: product.usage,
        precautions: product.precautions,
        product_profile: product.product_profile,
        cross_selling: product.cross_selling,
      },
    });
    setShowUrlInput(false);
    setUrlInputValue('');
    setModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await adminClient.uploadProductImage(file);
      if (res?.image_url) {
        setForm((prev) => ({ ...prev, images: [...prev.images, res.image_url] }));
        toast.success('Imagen subida con éxito');
      }
    } catch (err) {
      toast.error(err.message || 'Error al subir la imagen');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddUrlImage = () => {
    if (!urlInputValue.trim()) return;
    setForm((prev) => ({ ...prev, images: [...prev.images, urlInputValue.trim()] }));
    setUrlInputValue('');
    setShowUrlInput(false);
    toast.success('Imagen añadida a la galería');
  };

  const handleRemoveImage = (index) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleMoveImage = (index, direction) => {
    setForm((prev) => {
      const images = [...prev.images];
      const target = index + direction;
      if (target < 0 || target >= images.length) return prev;
      [images[index], images[target]] = [images[target], images[index]];
      return { ...prev, images };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price: parseInt(form.price, 10) || 0,
      stock: parseInt(form.stock, 10) || 0,
      category: form.category,
      benefit: form.benefit || '',
      product_type: form.product_type || '',
      is_hidden: Boolean(form.is_hidden),
      images: form.images,
      image_url: form.images[0] || null,
      benefits: form.benefits || [],
      certifications: form.certifications || [],
      google_doc_url: form.google_doc_url ? form.google_doc_url.trim() : null,
    };
    try {
      if (editingId) {
        await adminClient.updateProduct(editingId, payload);
        toast.success('Producto actualizado correctamente');
      } else {
        await adminClient.createProduct(payload);
        toast.success('Producto creado exitosamente');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Error al guardar producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Seguro que deseas eliminar "${name}" del catálogo?`)) return;
    try {
      await adminClient.deleteProduct(id);
      toast.success('Producto eliminado del catálogo');
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Error al eliminar producto');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            Catálogo de Productos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los precios, stock, galería de fotos y ficha técnica de tus suplementos
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button 
            onClick={fetchProducts} 
            variant="outline" 
            size="sm" 
            title="Recargar catálogo"
            className="rounded-xl gap-2 h-10 px-3 bg-card hover:bg-muted/60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            onClick={handleSync} 
            disabled={syncing} 
            variant="outline" 
            className="rounded-xl gap-2 h-10 px-4 bg-card hover:bg-muted/60 shadow-xs border-border/80 font-medium"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <CloudDownload className="h-4 w-4 text-primary" />}
            {syncing ? 'Sincronizando…' : 'Sincronizar catálogo'}
          </Button>
          <Button 
            onClick={openCreate} 
            className="rounded-xl gap-2 h-10 px-5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            <Plus className="h-4 w-4" /> Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Grid count & list */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center bg-card border border-border/60 rounded-3xl shadow-sm p-8 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground mb-4">
            <Tag className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No hay productos registrados</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-6">
            Puedes sincronizar con tu planilla de Google Sheets o crear tu primer producto manualmente.
          </p>
          <Button onClick={openCreate} className="rounded-xl gap-2">
            <Plus className="h-4 w-4" /> Crear Producto
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/80">{products.length} producto(s) en total</span>
            <span className="text-xs">Sincronizado con Google Sheets</span>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/30 font-medium text-muted-foreground border-b border-border/60 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-16">Imagen</th>
                    <th className="py-3.5 px-4">Producto</th>
                    <th className="py-3.5 px-4">Categoría / Tipo</th>
                    <th className="py-3.5 px-4">Precio</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/15 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted/30 border border-border/60 flex-shrink-0">
                          <SafeProductImage
                            src={p.images?.[0] || p.image_url}
                            alt={p.name}
                            className="w-full h-full"
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">{p.name}</div>
                        {p.benefit && (
                          <div className="text-xs text-muted-foreground/80 line-clamp-1 mt-0.5 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-accent inline" />
                            {p.benefit}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-foreground">{p.category || '—'}</div>
                        {p.product_type && (
                          <span className="text-[11px] text-muted-foreground inline-block mt-0.5">
                            {p.product_type}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground whitespace-nowrap">
                        {formatPrice(p.price)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.stock <= 5 
                            ? 'bg-destructive/10 text-destructive border border-destructive/20 font-semibold' 
                            : p.stock <= 15 
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' 
                            : 'bg-muted/80 text-foreground/80'
                        }`}>
                          {p.stock} un.
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {p.is_hidden ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                            <EyeOff className="h-3 w-3" /> Oculto
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-success/10 text-success">
                            Visible
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex gap-1.5 justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEdit(p)} 
                            title="Editar producto"
                            className="rounded-xl h-8 w-8 text-foreground/80 hover:text-primary hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(p.id, p.name)} 
                            title="Eliminar producto"
                            className="rounded-xl h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rediseñado: Formato 2 Columnas, Header y Footer fijos */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header Fijo */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {editingId ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {editingId ? 'Editar Producto' : 'Crear Nuevo Producto'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {editingId ? 'Modifica los datos comerciales, multimedia y clasificación' : 'Ingresa los datos para registrar un nuevo suplemento'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setModalOpen(false)}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Cuerpo Scrollable en 2 Columnas */}
            <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Columna Izquierda: Información General & Comercial (7 columnas) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-muted/15 border border-border/60 rounded-2xl p-4 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-primary" /> Datos Comerciales
                    </h4>

                    <div>
                      <Label className="text-xs font-semibold">Nombre del Producto *</Label>
                      <Input 
                        value={form.name} 
                        onChange={(e) => setForm({ ...form, name: e.target.value })} 
                        placeholder="Ej: Melena de León 500 mg"
                        required 
                        className="mt-1.5 rounded-xl bg-background"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold">Precio de Venta (CLP) *</Label>
                        <div className="relative mt-1.5">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
                          <Input 
                            type="number" 
                            value={form.price} 
                            onChange={(e) => setForm({ ...form, price: e.target.value })} 
                            placeholder="0"
                            required 
                            className="pl-7 rounded-xl bg-background font-medium"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Stock Disponible *</Label>
                        <Input 
                          type="number" 
                          value={form.stock} 
                          onChange={(e) => setForm({ ...form, stock: e.target.value })} 
                          placeholder="0"
                          required 
                          className="mt-1.5 rounded-xl bg-background font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Categoría *</Label>
                      <select
                        className="w-full mt-1.5 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        required
                      >
                        <option value="">Selecciona una categoría</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Coincide con la columna «Categoría / Objetivo» de la planilla.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold">Beneficio Principal</Label>
                        <Input
                          list="benefit-options"
                          value={form.benefit}
                          onChange={(e) => setForm({ ...form, benefit: e.target.value })}
                          placeholder="Ej: Concentración y Foco"
                          className="mt-1.5 rounded-xl bg-background text-xs"
                        />
                        <datalist id="benefit-options">
                          {benefitOptions.map((b) => <option key={b} value={b} />)}
                        </datalist>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Tipo / Formato</Label>
                        <Input
                          list="type-options"
                          value={form.product_type}
                          onChange={(e) => setForm({ ...form, product_type: e.target.value })}
                          placeholder="Ej: Cápsulas, Gotas, Polvo"
                          className="mt-1.5 rounded-xl bg-background text-xs"
                        />
                        <datalist id="type-options">
                          {typeOptions.map((t) => <option key={t} value={t} />)}
                        </datalist>
                      </div>
                    </div>
                  </div>

                  {/* Switch Visibilidad */}
                  <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 transition-all hover:bg-muted/30">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(form.is_hidden)}
                        onChange={(e) => setForm({ ...form, is_hidden: e.target.checked })}
                        className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary accent-primary"
                      />
                      <div className="space-y-0.5">
                        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <EyeOff className="h-4 w-4 text-muted-foreground" /> Ocultar del catálogo público
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          No aparecerá en la tienda ni en los carruseles principales, pero sigue siendo accesible y comprable por su enlace directo. Útil para productos de prueba.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Columna Derecha: Multimedia & Ficha Google Docs (5 columnas) */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Galería de Imágenes */}
                  <div className="bg-muted/15 border border-border/60 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <ImageIcon className="h-3.5 w-3.5 text-primary" /> Galería de Fotos ({form.images.length})
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                      >
                        <LinkIcon className="h-3 w-3" />
                        {showUrlInput ? 'Subir archivo' : 'Usar URL'}
                      </button>
                    </div>

                    {/* Previews de imágenes */}
                    {form.images.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2.5">
                        {form.images.map((url, index) => (
                          <div 
                            key={`${url}-${index}`} 
                            className="group relative aspect-square rounded-xl border border-border/80 overflow-hidden bg-background shadow-2xs"
                          >
                            <SafeProductImage 
                              src={url} 
                              alt={`Foto ${index + 1}`} 
                              className="w-full h-full"
                            />
                            
                            {index === 0 && (
                              <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                                Portada
                              </span>
                            )}

                            {/* Controles flotantes */}
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                              <button
                                type="button"
                                onClick={() => handleMoveImage(index, -1)}
                                disabled={index === 0}
                                title="Mover a la izquierda"
                                className="h-7 w-7 rounded-md bg-white/20 hover:bg-white/40 text-white flex items-center justify-center disabled:opacity-20 transition-colors"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                title="Eliminar imagen"
                                className="h-7 w-7 rounded-md bg-destructive/80 hover:bg-destructive text-white flex items-center justify-center transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveImage(index, 1)}
                                disabled={index === form.images.length - 1}
                                title="Mover a la derecha"
                                className="h-7 w-7 rounded-md bg-white/20 hover:bg-white/40 text-white flex items-center justify-center disabled:opacity-20 transition-colors"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed border-border/80 rounded-xl text-center bg-background/50">
                        <ImageIcon className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Sin imágenes asignadas</p>
                      </div>
                    )}

                    {/* Selector de subida o URL */}
                    {!showUrlInput ? (
                      <div>
                        <label className="flex flex-col items-center justify-center w-full py-3.5 px-3 border-2 border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer bg-background/60 hover:bg-muted/30 transition-all">
                          {uploadingImage ? (
                            <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Subiendo a la nube...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                              <Upload className="w-4 h-4 text-primary" />
                              <span className="text-xs font-semibold">Subir imagen (PNG, JPG, WEBP)</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={urlInputValue}
                          onChange={(e) => setUrlInputValue(e.target.value)}
                          placeholder="https://ejemplo.com/foto.webp"
                          className="text-xs h-9 rounded-xl bg-background"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddUrlImage}
                          className="rounded-xl h-9 px-3"
                        >
                          Añadir
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Ficha Google Docs */}
                  <div className="bg-muted/15 border border-border/60 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary" /> Ficha Técnica (Google Doc)
                    </h4>

                    <div>
                      <Input
                        value={form.google_doc_url || ''}
                        onChange={(e) => setForm({ ...form, google_doc_url: e.target.value })}
                        placeholder="https://docs.google.com/document/d/..."
                        className="text-xs rounded-xl bg-background"
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        El sync extrae automáticamente descripción, origen, ingredientes y precauciones.
                      </p>
                    </div>

                    {/* Badges de campos detectados */}
                    {form.docFields && Object.keys(form.docFields).length > 0 && (
                      <div className="pt-2 border-t border-border/40">
                        <p className="text-[11px] font-semibold text-muted-foreground mb-2">Campos importados:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries({
                            description: 'Descripción',
                            origin: 'Origen',
                            product_profile: 'Perfil',
                            cross_selling: 'Venta cruzada',
                            ingredients: 'Ingredientes',
                            usage: 'Modo de uso',
                            precautions: 'Precauciones',
                          }).map(([key, label]) => {
                            const hasValue = Boolean(form.docFields[key]);
                            return (
                              <span 
                                key={key} 
                                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium ${
                                  hasValue 
                                    ? 'bg-success/10 text-success border border-success/20' 
                                    : 'bg-muted/50 text-muted-foreground/60 border border-border/40'
                                }`}
                              >
                                {hasValue && <CheckCircle2 className="h-2.5 w-2.5" />}
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </form>

            {/* Footer Fijo con Botones */}
            <div className="p-4 sm:px-6 bg-muted/20 border-t border-border/60 flex items-center justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                disabled={saving}
                onClick={() => setModalOpen(false)} 
                className="rounded-xl px-5 h-10 font-medium"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                form="product-form"
                disabled={saving}
                className="rounded-xl px-6 h-10 font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Crear Producto')}
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
