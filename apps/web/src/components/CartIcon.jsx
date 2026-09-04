import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

const CartIcon = () => {
  const { getCartCount } = useCart();
  const count = getCartCount();

  return (
    <div className="relative">
      <ShoppingCart className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );
};

export default CartIcon;