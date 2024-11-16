const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection) {
        console.log('Using cached database connection');
        return cachedConnection;
    }

    try {
        console.log('Connecting to MongoDB...');
        const opts = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            bufferCommands: true,
            maxPoolSize: 1,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 5000,
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, opts);
        
        cachedConnection = conn;
        console.log('MongoDB connected successfully');
        
        return conn;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

module.exports = connectDB;