import { getAccessToken } from '@/lib/authClient';
import { createAdminFetcher, createBaseAdminClient } from '@nutrablue/shared';

const adminFetch = createAdminFetcher(getAccessToken);

const adminClient = {
  ...createBaseAdminClient(adminFetch),

  // Leads, Suggestions, Coupons (específico del panel admin)
  getLeads: () => adminFetch('/leads'),
  getSuggestions: () => adminFetch('/suggestions'),
  updateSuggestionStatus: (id, status) =>
    adminFetch(`/suggestions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getCoupons: () => adminFetch('/coupons'),
  createCoupon: (data) =>
    adminFetch('/coupons', { method: 'POST', body: JSON.stringify(data) }),
  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = await getAccessToken();
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch('/hcgi/api/admin/products/upload-image', {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'Error al subir la imagen del producto');
    }
    return response.json();
  },
};

export default adminClient;
