import test from 'node:test';
import assert from 'node:assert/strict';
import { generateHashtags } from '../../resources/js/tools/viral-hashtags.js';

test('hashtag generation deduplicates tags and ranks topic ideas first', () => {
    const result = generateHashtags('Iced coffee recipes', 'coffee, oat milk, iced coffee', 'instagram');

    assert.equal(result.all[0], '#IcedCoffeeRecipes');
    assert.equal(new Set(result.all.map((tag) => tag.toLowerCase())).size, result.all.length);
    assert.ok(result.all.includes('#Foodie'));
    assert.deepEqual(result.discovery, []);
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

    for (const tag of ['#Jobs', '#JobSearch', '#CareerOpportunities', '#Employment', '#JobHunting', '#InterviewTips', '#ResumeSkills', '#HiringNow']) {
        assert.ok(result.all.includes(tag), `Expected ${tag} in generated job hashtags`);
    }
    assert.ok(result.all.every((tag) => !['#ContentCreator', '#SEO', '#DigitalMarketing'].includes(tag)));
    assert.deepEqual(result.discovery, []);
});

test('job-related keywords keep suggestions focused on hiring and careers', () => {
    const result = generateHashtags('remote job openings', 'hiring, career opportunities', 'instagram');

    assert.ok(result.all.includes('#Jobs'));
    assert.ok(result.all.includes('#HiringNow'));
    assert.ok(result.all.includes('#CareerDevelopment'));
    assert.ok(result.all.every((tag) => !['#Foodie', '#Wanderlust', '#SEO', '#DigitalMarketing'].includes(tag)));
});

test('unrelated post topics produce distinct relevant tag sets', () => {
    const jobs = generateHashtags('job', '', 'instagram').all;
    const travel = generateHashtags('travel', '', 'instagram').all;
    const food = generateHashtags('coffee recipes', '', 'instagram').all;

    assert.ok(jobs.includes('#JobHunting'));
    assert.ok(travel.includes('#Wanderlust'));
    assert.ok(food.includes('#Foodie'));
    assert.notDeepEqual(jobs, travel);
    assert.notDeepEqual(travel, food);
    assert.ok(jobs.every((tag) => !travel.includes(tag)));
});

test('job titles add different profession-specific hashtags', () => {
    const marketing = generateHashtags('marketing manager job', '', 'instagram').all;
    const developer = generateHashtags('software developer job', '', 'instagram').all;

    assert.ok(marketing.includes('#MarketingJobs'));
    assert.ok(developer.includes('#DeveloperJobs'));
    assert.ok(!marketing.includes('#DeveloperJobs'));
    assert.ok(!developer.includes('#MarketingJobs'));
    assert.notDeepEqual(marketing, developer);
});

test('unknown platforms use the conservative default cap', () => {
    assert.ok(generateHashtags('Creative photography', '', 'unknown').all.length <= 30);
});
