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

/* Play kampanyayı referrer içindeki utm_* değerlerinden okur; yalnız Android’deki Play uygulamasında açılan ziyaretler sayılır. */
export function playStoreUrl(language: string, search?: string): string {
  const activeSearch = search ?? (typeof window === 'undefined' ? '' : window.location.search);
  const campaignId = resolveStoreCampaignId(language, activeSearch);
  const referrer = `utm_source=alika.tr&utm_medium=site&utm_campaign=${campaignId}`;
  return `https://play.google.com/store/apps/details?id=com.alika.parental&hl=${language}&referrer=${encodeURIComponent(referrer)}`;
}

