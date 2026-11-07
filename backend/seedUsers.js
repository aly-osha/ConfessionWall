const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

// Load env vars
dotenv.config();

const seedAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeding...');

        const seeds = [
            { email: 'admin@test.com', password: 'password123', age: 25, username: 'AdminUser', role: 'admin' },
            { email: 'mod@test.com', password: 'password123', age: 22, username: 'ModeratorOne', role: 'moderator' },
            { email: 'user@test.com', password: 'password123', age: 20, username: 'TestUser', role: 'user' },
        ];

        for (const s of seeds) {
            const exists = await User.findOne({ email: s.email });
            if (!exists) {
                await User.create(s);
                console.log(`✅ Created: ${s.email} / password123 (${s.role})`);
            } else {
                exists.password = 'password123';
                await exists.save();
                console.log(`ℹ️ Already exists, password reset: ${s.email} / password123 (${s.role})`);
            }
        }

        console.log('Seeding Complete. You can now log in.');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedAdmins();
