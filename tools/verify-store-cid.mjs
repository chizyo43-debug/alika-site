import assert from 'node:assert/strict';
import { microsoftStoreUrl, normalizeCampaignId, playStoreUrl, resolveStoreCampaignId } from '../src/store-campaign.ts';

assert.equal(normalizeCampaignId('youtube_channel_profile_tr'), 'youtube_channel_profile_tr');
assert.equal(normalizeCampaignId('LinkedIn-Founder-TR'), 'linkedin-founder-tr');
assert.equal(normalizeCampaignId(''), null);
assert.equal(normalizeCampaignId('youtube profile'), null);
assert.equal(normalizeCampaignId('youtube_profile&next=https://example.com'), null);
assert.equal(normalizeCampaignId(`x${'a'.repeat(80)}`), null);

assert.equal(resolveStoreCampaignId('tr'), 'site_home_tr');
assert.equal(resolveStoreCampaignId('ja', '?cid=community_ja_madonomori'), 'community_ja_madonomori');
assert.equal(resolveStoreCampaignId('ko', '?cid=bad%20campaign'), 'site_home_ko');

assert.equal(
  microsoftStoreUrl('tr', '?cid=youtube_channel_profile_tr'),
  'https://apps.microsoft.com/detail/9N3P9F5ZKR5S?cid=youtube_channel_profile_tr',
);
assert.equal(
  microsoftStoreUrl('de', '?cid=bad%26campaign'),
  'https://apps.microsoft.com/detail/9N3P9F5ZKR5S?cid=site_home_de',
);

assert.equal(
  playStoreUrl('tr', ''),
  'https://play.google.com/store/apps/details?id=com.alika.parental&hl=tr&referrer=utm_source%3Dalika.tr%26utm_medium%3Dsite%26utm_campaign%3Dsite_home_tr',
);
assert.equal(
  playStoreUrl('en', '?cid=LinkedIn-Founder-TR'),
  'https://play.google.com/store/apps/details?id=com.alika.parental&hl=en&referrer=utm_source%3Dalika.tr%26utm_medium%3Dsite%26utm_campaign%3Dlinkedin-founder-tr',
);
assert.equal(
  playStoreUrl('ja', '?cid=bad%26campaign'),
  'https://play.google.com/store/apps/details?id=com.alika.parental&hl=ja&referrer=utm_source%3Dalika.tr%26utm_medium%3Dsite%26utm_campaign%3Dsite_home_ja',
);

console.log('Store CID propagation is valid.');

