import React, { useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import ScrollToTop from '@/components/ScrollToTop';

import HomePage from '@/pages/HomePage';
import ShopPage from '@/pages/ShopPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderConfirmationPage from '@/pages/OrderConfirmationPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TermsOfServicePage from '@/pages/TermsOfServicePage';
import ImpactPage from '@/pages/ImpactPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import AccountPage from '@/pages/AccountPage';
import HistoriaPage from '@/pages/HistoriaPage';
import ContactoPage from '@/pages/ContactoPage';
import FaqPage from '@/pages/FaqPage';

const RedirectToAdmin = () => {
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '::1';
    // En local → dev del admin; en cualquier entorno de producción/staging → admin en Vercel
    window.location.href = isLocal ? 'http://localhost:3002' : 'https://nutra-blue-admin.vercel.app/';
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
      Redireccionando al Panel de Administración...
    </div>
  );
};


function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="/impacto" element={<ImpactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/admin" element={<RedirectToAdmin />} />
            <Route path="/historia" element={<HistoriaPage />} />
            <Route path="/contacto" element={<ContactoPage />} />
            <Route path="/faqs" element={<FaqPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

