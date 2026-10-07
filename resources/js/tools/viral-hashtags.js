const PLATFORM_LIMITS = {
    instagram: 30,
    tiktok: 10,
    youtube: 15,
    x: 5,
    linkedin: 5,
};

const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'in', 'is', 'it',
    'of', 'on', 'or', 'the', 'this', 'to', 'with', 'your',
]);

const TOPIC_GROUPS = [
    { jobOnly: true, match: /\b(job|jobs|employment|hiring|career|careers|recruitment|recruiter|vacancy|vacancies|resume|cv|work)\b/iu, tags: ['JobSearch', 'Jobs', 'Hiring', 'NowHiring', 'Career', 'CareerOpportunities', 'JobOpening', 'JobAlert', 'Recruitment', 'Employment', 'RemoteJobs', 'WorkFromHome'] },
    { match: /\b(coffee|cafe|café|espresso|latte|tea|recipe|recipes|baking|food|cook|cooking|vegan|dessert|dinner|lunch|breakfast)\b/iu, tags: ['Foodie', 'FoodPhotography', 'HomeCooking', 'RecipeIdeas', 'FoodLovers', 'Delicious'] },
    { match: /\b(travel|traveling|travelling|holiday|vacation|trip|destination|backpack|adventure)\b/iu, tags: ['TravelGram', 'Wanderlust', 'TravelPhotography', 'ExploreMore', 'AdventureAwaits', 'TravelTips'] },
    { match: /\b(fitness|workout|gym|training|exercise|running|run|yoga|health|wellness|nutrition)\b/iu, tags: ['FitnessJourney', 'FitLife', 'WorkoutMotivation', 'HealthyHabits', 'WellnessJourney', 'StayActive'] },
    { match: /\b(beauty|makeup|skincare|skin|hair|cosmetic|nails)\b/iu, tags: ['BeautyTips', 'SkincareRoutine', 'BeautyCommunity', 'SelfCare', 'GlowUp', 'BeautyInspiration'] },
    { match: /\b(fashion|style|outfit|clothing|streetwear|design|wardrobe)\b/iu, tags: ['StyleInspiration', 'OutfitIdeas', 'FashionStyle', 'DailyLook', 'WearItYourWay', 'StyleTips'] },
    { match: /\b(photo|photography|camera|portrait|landscape|photojournalism)\b/iu, tags: ['Photography', 'PhotoOfTheDay', 'CaptureTheMoment', 'VisualStorytelling', 'CreativePhotography', 'PhotographyLovers'] },
    { match: /\b(business|entrepreneur|startup|smallbusiness|marketing|brand|sales)\b/iu, tags: ['SmallBusiness', 'EntrepreneurLife', 'BusinessTips', 'BuildInPublic', 'MarketingStrategy', 'BusinessGrowth'] },
    { match: /\b(tech|technology|software|coding|programming|developer|ai|artificial intelligence|app)\b/iu, tags: ['TechCommunity', 'TechnologyToday', 'CodingLife', 'DeveloperTools', 'Innovation', 'LearnToCode'] },
    { match: /\b(game|gaming|gamer|esports|stream|streaming)\b/iu, tags: ['GamingCommunity', 'GamerLife', 'GamingHighlights', 'PlayTogether', 'GameOn', 'GamingContent'] },
    { match: /\b(book|books|reading|author|writing|writer|novel|poetry)\b/iu, tags: ['BookLovers', 'BookCommunity', 'ReadingTime', 'WritersOfInstagram', 'CurrentlyReading', 'WordsMatter'] },
    { match: /\b(art|artist|painting|drawing|illustration|craft|creative|handmade)\b/iu, tags: ['ArtistOnInstagram', 'CreativeProcess', 'ArtCommunity', 'MadeByMe', 'CreativeInspiration', 'ArtOfTheDay'] },
    { match: /\b(pet|pets|dog|dogs|puppy|cat|cats|animal)\b/iu, tags: ['PetLovers', 'PetsOfInstagram', 'AnimalFriends', 'DailyPets', 'PetCare', 'PawLife'] },
    { match: /\b(home|interior|decor|garden|plant|plants|diy|organization)\b/iu, tags: ['HomeInspiration', 'InteriorStyle', 'HomeProjects', 'PlantLovers', 'CozyHome', 'SimpleLiving'] },
    { match: /\b(learn|learning|education|study|student|teaching|teacher|course|tutorial)\b/iu, tags: ['LearnSomethingNew', 'StudyTips', 'LearningEveryday', 'EducationMatters', 'HowToLearn', 'KnowledgeSharing'] },
    { match: /\b(music|song|singing|singer|guitar|piano|band|musician)\b/iu, tags: ['MusicLovers', 'NewMusic', 'MusicCommunity', 'Songwriter', 'ListenToThis', 'MusicInspiration'] },
];

const DISCOVERY_TAGS = [
    'ContentCreator', 'CreativeCommunity', 'DailyInspiration', 'MadeForYou', 'ShareYourStory',
    'SocialMedia', 'SEO', 'DigitalMarketing', 'MarketingStrategy',
];

const POPULAR_SEO_TAGS = [
    'SEO', 'SEOTips', 'SEOExpert', 'SearchEngineOptimization',
    'DigitalMarketing', 'MarketingStrategy', 'ContentMarketing',
    'SocialMediaMarketing', 'BrandGrowth', 'BusinessGrowth', 'GoogleRanking',
];

const toHashtag = (value) => {
    const words = value.normalize('NFKD')
        .replace(/[\u0300-\u036f]/gu, '')
        .match(/[\p{L}\p{N}]+/gu) ?? [];

    return words
        .filter((word) => !STOP_WORDS.has(word.toLocaleLowerCase()))
        .map((word) => {
            const lower = word.toLocaleLowerCase();
            if (['seo', 'ai', 'ui', 'ux', 'ig', 'fb', 'tiktok', 'youtube'].includes(lower)) {
                return word.toLocaleUpperCase();
            }
            return word.charAt(0).toLocaleUpperCase() + word.slice(1);
        })
        .join('')
        .slice(0, 30);
};

function buildPopularSeoTags(sourceText) {
    const normalized = sourceText.toLocaleLowerCase();
    const matches = new Set();

    if (/(seo|search engine optimization|keyword|ranking|google)/iu.test(normalized)) {
        POPULAR_SEO_TAGS.forEach((tag) => matches.add(`#${tag}`));
    }

    if (/(marketing|brand|business|sales|growth|traffic)/iu.test(normalized)) {
        ['DigitalMarketing', 'MarketingStrategy', 'BusinessGrowth', 'BrandGrowth', 'SocialMediaMarketing']
            .forEach((tag) => matches.add(`#${tag}`));
    }

    if (/(content|creator|social|instagram|tiktok|youtube|blog)/iu.test(normalized)) {
        ['ContentCreator', 'ContentMarketing', 'SocialMediaMarketing', 'InstagramGrowth']
            .forEach((tag) => matches.add(`#${tag}`));
    }

    return [...matches];
}

function inputPhrases(value) {
    const phrases = value
        .split(/[\n,;]+/u)
        .map((phrase) => phrase.trim())
        .filter(Boolean);

    return phrases.flatMap((phrase) => {
        const words = phrase.match(/[\p{L}\p{N}]+/gu) ?? [];
        const phrasesAndWords = [phrase, ...words];

        for (let index = 0; index < words.length - 1; index += 1) {
            phrasesAndWords.push(`${words[index]} ${words[index + 1]}`);
        }

        return phrasesAndWords;
    });
}

/**
 * Build locally generated hashtag suggestions; this does not represent live
 * popularity, trends, or predicted reach on any social platform.
 *
 * @param {string} topic
 * @param {string} keywords
 * @param {keyof typeof PLATFORM_LIMITS} platform
 * @returns {{topic: string[], niche: string[], discovery: string[], all: string[]}}
 */
export function generateHashtags(topic, keywords, platform) {
    const limit = PLATFORM_LIMITS[platform] ?? PLATFORM_LIMITS.instagram;
    const sourceText = [topic, keywords].filter(Boolean).join(', ').trim();
    const jobSearch = /\b(job|jobs|employment|hiring|career|careers|recruitment|recruiter|vacancy|vacancies|resume|cv|work)\b/iu.test(sourceText);
    const popularSeo = jobSearch ? [] : buildPopularSeoTags(sourceText);
    const core = [...new Set(inputPhrases(sourceText).map(toHashtag).filter((tag) => tag.length >= 2))]
        .map((tag) => `#${tag}`);

    const related = TOPIC_GROUPS
        .filter((group) => group.match.test(sourceText) && (!jobSearch || group.jobOnly === true))
        .flatMap((group) => group.tags)
        .map((tag) => `#${tag}`);

    if (jobSearch && /\b(remote|work from home|wfh)\b/iu.test(sourceText)) {
        related.unshift('#RemoteJobs', '#WorkFromHome');
    }

    const tiers = {
        topic: [...new Set(jobSearch ? [...related, ...core] : [...core, ...popularSeo])],
        niche: jobSearch ? [] : [...new Set(related)],
        discovery: jobSearch ? [] : DISCOVERY_TAGS.map((tag) => `#${tag}`),
    };
    const unique = [];
    const seen = new Set();

    for (const tag of [...tiers.topic, ...tiers.niche, ...tiers.discovery]) {
        const normalized = tag.toLocaleLowerCase();

        if (!seen.has(normalized)) {
            seen.add(normalized);
            unique.push(tag);
        }
    }

    tiers.topic = tiers.topic.filter((tag) => unique.indexOf(tag) < limit);
    tiers.niche = tiers.niche.filter((tag) => unique.indexOf(tag) < limit && !tiers.topic.includes(tag));
    tiers.discovery = tiers.discovery.filter((tag) => unique.indexOf(tag) < limit
        && !tiers.topic.includes(tag)
        && !tiers.niche.includes(tag));

    return { ...tiers, all: unique.slice(0, limit) };
}
