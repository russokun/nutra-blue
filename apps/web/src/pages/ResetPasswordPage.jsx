import React, { useState } from 'react';
import { Helmet } from '@/components/Meta';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { resetPassword, authAvailable } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authAvailable) {
      toast.error('Autenticación no disponible. Configura Supabase en el entorno.');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(password);
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.message || 'No pudimos actualizar tu contraseña. El enlace pudo haber expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Restablecer Contraseña - NutraBlue</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-md mx-auto px-4">
          <h1 className="text-3xl font-display text-foreground mb-8 text-center">
            Restablecer Contraseña
          </h1>
          <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 border border-border space-y-4">
            <div>
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="mt-1" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ResetPasswordPage;
