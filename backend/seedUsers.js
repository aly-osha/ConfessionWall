const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

// Load env vars
dotenv.config();

const seedAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeding...');

        // Create Admin
        const adminExists = await User.findOne({ email: 'admin@test.com' });
        if (!adminExists) {
            await User.create({
                email: 'admin@test.com',
                password: 'password123',
                age: 25,
                username: 'AdminUser',
                role: 'admin',
            });
            console.log('✅ Admin user created: admin@test.com / password123');
        } else {
            console.log('ℹ️ Admin user already exists');
        }

        // Create Moderator
        const modExists = await User.findOne({ email: 'mod@test.com' });
        if (!modExists) {
            await User.create({
                email: 'mod@test.com',
                password: 'password123',
                age: 22,
                username: 'ModeratorOne',
                role: 'moderator',
            });
            console.log('✅ Moderator user created: mod@test.com / password123');
        } else {
            console.log('ℹ️ Moderator user already exists');
        }

        console.log('Seeding Complete. You can now log in.');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedAdmins();
