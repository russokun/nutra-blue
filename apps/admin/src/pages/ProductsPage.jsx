import React, { useState, useEffect } from 'react';
import adminClient from '@/lib/adminClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Tag, RefreshCw, Upload, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';

const emptyProduct = {
  name: '', price: '', stock: '', category: 'Longevidad', images: [],
};

const CATEGORIES = ['Salud Cognitiva', 'Gestión del Estrés', 'Longevidad'];

const formatPrice = (price) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');

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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyProduct);
    setShowUrlInput(false);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      category: product.category,
      images: product.images?.length ? product.images : (product.image_url ? [product.image_url] : []),
    });
    setShowUrlInput(false);
    setModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await adminClient.uploadProductImage(file);
      setForm((prev) => ({ ...prev, images: [...prev.images, res.image_url] }));
      toast.success('Imagen subida con éxito');
    } catch (err) {
      toast.error(err.message || 'Error al subir la imagen');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddUrlImage = (url) => {
    if (!url.trim()) return;
    setForm((prev) => ({ ...prev, images: [...prev.images, url.trim()] }));
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
    const payload = {
      name: form.name,
      price: parseInt(form.price, 10),
      stock: parseInt(form.stock, 10),
      category: form.category,
      images: form.images,
      image_url: form.images[0] || null,
      benefits: [],
      certifications: [],
    };
    try {
      if (editingId) {
        await adminClient.updateProduct(editingId, payload);
        toast.success('Producto actualizado');
      } else {
        await adminClient.createProduct(payload);
        toast.success('Producto creado');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Error al guardar producto');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este producto del catálogo?')) return;
    try {
      await adminClient.deleteProduct(id);
      toast.success('Producto eliminado del catálogo');
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Error al eliminar producto');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
            Catálogo de Productos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Controla los precios, el stock y la clasificación de suplementos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchProducts} variant="outline" size="sm" className="rounded-xl gap-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={openCreate} className="rounded-xl gap-2 shadow-md">
            <Plus className="h-4.5 w-4.5" /> Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Grid count & list */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center bg-card border border-border/60 rounded-2xl shadow-sm">
          <p className="text-muted-foreground text-sm">No se encontraron productos registrados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground font-medium px-1">
            {products.length} producto(s) en el catálogo
          </div>

          <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 font-medium text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="p-4">Imagen</th>
                    <th className="p-4">Nombre del Producto</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Precio (CLP)</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-border/60 hover:bg-muted/5 transition-colors">
                      <td className="p-4">
                        {p.image_url ? (
                          <img 
                            src={p.image_url} 
                            alt={p.name} 
                            className="w-10 h-10 object-cover rounded-lg border border-border"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                            <Tag className="h-4 w-4" />
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-foreground">{p.name}</td>
                      <td className="p-4 text-muted-foreground">{p.category}</td>
                      <td className="p-4 font-semibold text-foreground">{formatPrice(p.price)}</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                          p.stock <= 10 ? 'bg-rose-100 text-rose-800' : 'bg-muted text-muted-foreground'
                        }`}>
                          {p.stock} un.
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="rounded-lg h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="rounded-lg h-8 w-8 text-destructive hover:bg-destructive/10">
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

      {/* Modal Drawer: Create / Edit Product */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-foreground mb-4">
              {editingId ? 'Editar Producto' : 'Crear Nuevo Producto'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre del Producto</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  required 
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Precio (CLP)</Label>
                  <Input 
                    type="number" 
                    value={form.price} 
                    onChange={(e) => setForm({ ...form, price: e.target.value })} 
                    required 
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input 
                    type="number" 
                    value={form.stock} 
                    onChange={(e) => setForm({ ...form, stock: e.target.value })} 
                    required 
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Categoría</Label>
                <select
                  className="w-full mt-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Imágenes del Producto</Label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    {showUrlInput ? 'Subir archivo (PNG/JPG)' : 'Usar URL externa'}
                  </button>
                </div>

                {form.images.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {form.images.map((url, index) => (
                      <div key={`${url}-${index}`} className="relative w-20 h-20 rounded-xl border border-border overflow-hidden bg-muted/20 group">
                        <img src={url} alt={`Vista previa ${index + 1}`} className="w-full h-full object-cover" />
                        {index === 0 && (
                          <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            Portada
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveImage(index, -1)}
                              disabled={index === 0}
                              className="text-white disabled:opacity-30 hover:text-primary"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="text-white hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveImage(index, 1)}
                              disabled={index === form.images.length - 1}
                              className="text-white disabled:opacity-30 hover:text-primary"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!showUrlInput ? (
                  <div className="mt-1">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors">
                      {uploadingImage ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span>Subiendo imagen...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center px-4">
                          <Upload className="w-5 h-5 mb-1.5 text-muted-foreground" />
                          <p className="text-xs text-foreground font-semibold">Agregar otra imagen</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, WEBP (Máx 10 MB)</p>
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
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={urlInputValue}
                      onChange={(e) => setUrlInputValue(e.target.value)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { handleAddUrlImage(urlInputValue); setUrlInputValue(''); }}
                    >
                      Agregar
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl">{editingId ? 'Guardar Cambios' : 'Crear Producto'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
