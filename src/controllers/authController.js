const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        // debug
        console.log('Register request body:', req.body);
        console.log('Content-Type:', req.headers['content-type']);
        const { username, email, password } = req.body || {};

        // cek terisi
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required',
                missing: {
                    username: !username,
                    email: !email,
                    password: !password
                }
            });
        }

        // cek apakah user sudah terdaftar
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email or username already exists'
            });
        }

        // buat user baru
        const user = new User({
            username,
            email,
            password
        });

        await user.save();

        // token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-default-secret',
            { expiresIn: '24h' }
        );

        return res.status(201).json({
            success: true,
            data: {
                userId: user._id,
                username: user.username,
                email: user.email,
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            success: true,
            data: {
                userId: user._id,
                username: user.username,
                email: user.email,
                token: token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};