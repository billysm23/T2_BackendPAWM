// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        // verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // cari user
        const user = await User.findById(decoded.userId);
        // user tidak ada
        if (!user) {
            throw new Error('User not found');
        }
        // kalau ada, user melakukan request
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ 
            success: false, 
            error: 'Please authenticate properly' 
        });
    }
};

module.exports = auth;