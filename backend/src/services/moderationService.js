const Filter = require('bad-words');

// Initialize the bad-words filter
const customFilter = new Filter({ placeHolder: '*' });

// You can add more custom bad words specific to your application
// customFilter.addWords('somebadword', 'anotherone');

/**
 * Moderation Service
 * Since this is a student project without paid APIs (like OpenAI),
 * we simulate an AI moderation flow.
 * Layer 1: bad-words package (profanity)
 * Layer 2: simulated sentiment analysis or mock API call
 */
const moderateContent = async (text) => {
    // Layer 1: Check for basic profanity using 'bad-words' package
    if (customFilter.isProfane(text)) {
        return {
            isFlagged: true,
            riskScore: 0.9,
            reason: 'Profane or inappropriate language detected.',
        };
    }

    // Layer 2: Simulated "AI" Hate speech / bullying detection
    // In a real world app, you would send `text` to an API like OpenAI here.
    const badPhrases = [
        'hate you',
        'kill yourself',
        'die',
        'idiot',
        'stupid',
        'ugly',
        'loser'
    ]; // Add more phrases for better mock detection

    const lowerText = text.toLowerCase();

    for (let phrase of badPhrases) {
        if (lowerText.includes(phrase)) {
            return {
                isFlagged: true,
                riskScore: 0.85,
                reason: 'Harmful language, bullying, or hate speech detected by AI.',
            };
        }
    }

    // Content is clean
    return {
        isFlagged: false,
        riskScore: 0.1,
        reason: 'Clean',
    };
};

module.exports = { moderateContent };
