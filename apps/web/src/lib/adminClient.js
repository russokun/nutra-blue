import { getAccessToken } from '@/lib/authClient';
import { createAdminFetcher, createBaseAdminClient } from '@nutrablue/shared';

const adminFetch = createAdminFetcher(getAccessToken);
const adminClient = createBaseAdminClient(adminFetch);

export default adminClient;
