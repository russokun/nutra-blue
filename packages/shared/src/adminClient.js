/**
 * Fetcher base autenticado hacia /admin/*. Cada app arma su propio adminClient
 * envolviendo este fetcher con los métodos que necesita (el panel admin agrega
 * leads/suggestions/coupons encima del set base).
 */
export function createAdminFetcher(getAccessToken, { apiBase = '/hcgi/api/admin' } = {}) {
  return async function adminFetch(path, options = {}) {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Debes iniciar sesión para acceder al panel de administración');
    }

    const res = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Error en la solicitud');
    }

    if (res.status === 204) return null;
    return res.json();
  };
}

/** Set base de métodos admin, común a ambas apps (orders + products). */
export function createBaseAdminClient(adminFetch) {
  return {
    getOrders: (status) => adminFetch(status ? `/orders?status=${status}` : '/orders'),
    updateOrderStatus: (orderId, status) =>
      adminFetch(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    getProducts: () => adminFetch('/products'),
    createProduct: (data) =>
      adminFetch('/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id, data) =>
      adminFetch(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteProduct: (id) => adminFetch(`/products/${id}`, { method: 'DELETE' }),
  };
}
