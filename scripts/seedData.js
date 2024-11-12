// scripts/seedData.js
const mongoose = require('mongoose');
const { User, UserProgress } = require('../src/models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Buat test user
        const testUsers = [
            {
                username: 'testuser1',
                email: 'test1@example.com',
                password: await bcrypt.hash('password123', 10)
            },
            {
                username: 'testuser2',
                email: 'test2@example.com',
                password: await bcrypt.hash('password123', 10)
            }
        ];

        const users = await User.create(testUsers);
        console.log('Test users created');

        // Buat progress data
        const progressData = [
            {
                username: 'testuser1',
                theme: 'dark',
                lessons: [
                    {
                        lesson_id: 'lesson1',
                        status: 'completed',
                        quiz_answers: [
                            {
                                question_id: 'q1',
                                selected_answer: 'a',
                                is_correct: true
                            }
                        ],
                        score: 100
                    }
                ]
            },
            {
                username: 'testuser2',
                theme: 'light',
                lessons: [
                    {
                        lesson_id: 'lesson1',
                        status: 'started',
                        quiz_answers: [],
                        score: 0
                    }
                ]
            }
        ];

        await UserProgress.create(progressData);
        console.log('Test progress data created');

        console.log('Seeding completed successfully');
    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        await mongoose.connection.close();
    }
};

seedData();