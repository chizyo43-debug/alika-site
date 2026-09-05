const CAMPAIGN_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,79}$/i;

export function normalizeCampaignId(value: string | null): string | null {
  if (!value || !CAMPAIGN_ID_PATTERN.test(value)) return null;
  return value.toLowerCase();
}

export function resolveStoreCampaignId(language: string, search = ''): string {
  const incoming = normalizeCampaignId(new URLSearchParams(search).get('cid'));
  return incoming ?? `site_home_${language}`;
}

export function microsoftStoreUrl(language: string, search?: string): string {
  const activeSearch = search ?? (typeof window === 'undefined' ? '' : window.location.search);
  const campaignId = resolveStoreCampaignId(language, activeSearch);
  return `https://apps.microsoft.com/detail/9N3P9F5ZKR5S?cid=${encodeURIComponent(campaignId)}`;
}

