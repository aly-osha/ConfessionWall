const User = require('../models/User');

const generateAnonymousUsername = async () => {
    const adjectives = ['Silent', 'Hidden', 'Phantom', 'Ghost', 'Shadow', 'Secret', 'Mystic', 'Unknown', 'Veiled', 'Dark'];
    const nouns = ['Observer', 'Soul', 'Whisper', 'Echo', 'Seeker', 'Wanderer', 'Voice', 'Drifter', 'Specter', 'Mind'];

    let username;
    let isUnique = false;

    while (!isUnique) {
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const randomNumber = Math.floor(Math.random() * 10000);

        username = `${randomAdjective}${randomNoun}${randomNumber}`;

        // Check if username exists
        const existingUser = await User.findOne({ username });
        if (!existingUser) {
            isUnique = true;
        }
    }

    return username;
};

module.exports = generateAnonymousUsername;
