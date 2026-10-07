import test from 'node:test';
import assert from 'node:assert/strict';
import { generateHashtags } from '../../resources/js/tools/viral-hashtags.js';

test('hashtag generation deduplicates tags and ranks topic ideas first', () => {
    const result = generateHashtags('Iced coffee recipes', 'coffee, oat milk, iced coffee', 'instagram');

    assert.equal(result.all[0], '#IcedCoffeeRecipes');
    assert.equal(new Set(result.all.map((tag) => tag.toLowerCase())).size, result.all.length);
    assert.ok(result.all.includes('#Foodie'));
    assert.ok(result.all.includes('#ContentCreator'));
});

test('platform selection applies a sensible maximum suggestion count', () => {
    assert.ok(generateHashtags('Travel photography', '', 'instagram').all.length <= 30);
    assert.ok(generateHashtags('Travel photography', '', 'tiktok').all.length <= 10);
    assert.equal(generateHashtags('Travel photography', '', 'x').all.length, 5);
});

test('hashtags normalize accents and discard punctuation and filler words', () => {
    const result = generateHashtags('Café & the Best Dog-Friendly Walks!', '', 'linkedin');

    assert.ok(result.all.includes('#CafeBestDogFriendlyWalks'));
    assert.ok(result.all.every((tag) => /^#[\p{L}\p{N}]+$/u.test(tag)));
});

test('empty or punctuation-only topics produce no topic hashtags', () => {
    assert.deepEqual(generateHashtags('', '', 'instagram').topic, []);
    assert.deepEqual(generateHashtags('!? 🎉', '', 'instagram').topic, []);
});

test('seo-focused topics include popular rankings and marketing tags without duplicates', () => {
    const result = generateHashtags('SEO strategy for small business', '', 'instagram');

    assert.ok(result.all.includes('#SEO'));
    assert.ok(result.all.includes('#DigitalMarketing'));
    assert.ok(result.all.includes('#MarketingStrategy'));
    assert.equal(new Set(result.all.map((tag) => tag.toLowerCase())).size, result.all.length);
});

test('job searches return job and career hashtags without unrelated discovery or marketing tags', () => {
    const result = generateHashtags('job', '', 'instagram');

    assert.ok(result.all.includes('#JobSearch'));
    assert.ok(result.all.includes('#Hiring'));
    assert.ok(result.all.includes('#CareerOpportunities'));
    assert.ok(result.all.every((tag) => !['#ContentCreator', '#SEO', '#DigitalMarketing'].includes(tag)));
    assert.deepEqual(result.discovery, []);
});

test('job-related keywords keep suggestions focused on hiring and careers', () => {
    const result = generateHashtags('remote job openings', 'hiring, career opportunities', 'tiktok');

    assert.ok(result.all.includes('#RemoteJobs'));
    assert.ok(result.all.includes('#NowHiring'));
    assert.ok(result.all.includes('#JobAlert'));
    assert.ok(result.all.every((tag) => /job|career|hir|recruit|employment|work|vacanc/iu.test(tag)));
});

test('unknown platforms use the conservative default cap', () => {
    assert.ok(generateHashtags('Creative photography', '', 'unknown').all.length <= 30);
});
