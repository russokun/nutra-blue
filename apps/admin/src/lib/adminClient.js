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
};

export default adminClient;
