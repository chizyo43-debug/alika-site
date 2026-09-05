import assert from 'node:assert/strict';
import { microsoftStoreUrl, normalizeCampaignId, resolveStoreCampaignId } from '../src/store-campaign.ts';

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

console.log('Store CID propagation is valid.');

