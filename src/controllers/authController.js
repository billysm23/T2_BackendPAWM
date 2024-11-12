const User = require('../models/user');
const Session = require('../models/session');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/errors/AppError');
const ErrorCodes = require('../utils/errors/errorCodes');
const asyncHandler = require('../utils/asyncHandler');

const JWT_EXPIRES_IN = '24h';

const generateToken = (userId, username) => {
    return jwt.sign(
        { userId, username },
        process.env.JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
        throw new AppError('Email is required', 400, ErrorCodes.MISSING_FIELD);
    }
    if (!emailRegex.test(email)) {
        throw new AppError(
            'Invalid email format. Please use a valid email address (e.g., user@domain.com)',
            400,
            ErrorCodes.INVALID_FORMAT
        );
    }
};

const validateUsername = (username) => {
    if (!username) {
        throw new AppError('Username is required', 400, ErrorCodes.MISSING_FIELD);
    }
    if (username.length < 6 || username.length > 30) {
        throw new AppError(
            'Username must be between 6 and 30 characters',
            400,
            ErrorCodes.VALIDATION_ERROR
        );
    }
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!usernameRegex.test(username)) {
        throw new AppError(
            'Username can only contain letters, numbers, dots, underscores, and hyphens',
            400,
            ErrorCodes.INVALID_FORMAT
        );
    }
};

const validatePassword = (password, fieldName = 'Password') => {
    if (!password) {
        throw new AppError(
            `${fieldName} is required`,
            400,
            ErrorCodes.MISSING_FIELD
        );
    }
    if (password.length < 6) {
        throw new AppError(
            `${fieldName} must be at least 6 characters long`,
            400,
            ErrorCodes.VALIDATION_ERROR
        );
    }
    // Validasi keamanan password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(password)) {
        throw new AppError(
            `${fieldName} must contain at least one uppercase letter, one lowercase letter, one number and one special character`,
            400,
            ErrorCodes.VALIDATION_ERROR
        );
    }
};

exports.register = asyncHandler(async (req, res, next) => {
    const { username, email, password } = req.body || {};

    // Validasi input satu per satu
    validateEmail(email);
    validatePassword(password);
    validateUsername(username);

    // Cek user yang sudah ada
    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        let message = 'User already exists with this ';
        if (existingUser.email === email && existingUser.username === username) {
            message += 'email and username';
        } else if (existingUser.email === email) {
            message += 'email';
        } else {
            message += 'username';
        }
        throw new AppError(message, 409, ErrorCodes.RESOURCE_EXISTS);
    }

    // Buat user baru
    const user = new User({
        username,
        email,
        password
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.username);

    res.status(201).json({
        success: true,
        data: {
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        }
    });
});

exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Cek apakah sudah ada session aktif
    const existingSession = await Session.findOne({
        userId: user._id,
        isActive: true
    });
    if (existingSession) {
        throw new AppError(
            'User already logged in. Please logout first',
            400,
            ErrorCodes.SESSION_EXISTS
        );
    }

    // Validasi email dan password untuk login
    validateEmail(email);
    validatePassword(password);

    // Cek user terdaftar atau tidak
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw new AppError(
            'Email is not registered. Please register first.',
            404,
            ErrorCodes.USER_NOT_FOUND
        );
    }

    // Cek password
    const isPasswordTrue = await bcrypt.compare(password, user.password);
    if (!isPasswordTrue) {
        throw new AppError(
            'Invalid password',
            401,
            ErrorCodes.INVALID_CREDENTIALS
        );
    }

    // Generate token
    const token = generateToken(user._id, user.username);

    // Buat session baru
    await Session.create({
        userId: user._id,
        token
    });

    user.password = undefined;

    res.json({
        success: true,
        data: {
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        }
    });
});

exports.logout = asyncHandler(async (req, res, next) => {
    // Cek apakah sudah ada session aktif
    const existingSession = await Session.findOne({
        userId: user._id,
        isActive: true
    });
    if (!existingSession) {
        throw new AppError(
            'User hasn\'t logged in. Please login first',
            400,
            ErrorCodes.SESSION_INVALID
        );
    }

    // Nonaktifkan session
    await Session.findOneAndUpdate(
        { 
            userId: req.user._id,
            token: req.token,
            isActive: true
        },
        { isActive: false }
    );

    res.json({
        success: true,
        message: 'Successfully logged out'
    });
});

exports.updatePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    // Validasi input
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        throw new AppError(
            'Please provide current password, new password and confirm new password',
            400,
            ErrorCodes.MISSING_FIELD
        );
    }

    // Validasi konfirmasi password
    if (newPassword !== confirmNewPassword) {
        throw new AppError(
            'New password and confirm password do not match',
            400,
            ErrorCodes.VALIDATION_ERROR
        );
    }

    // Validasi format password baru
    validatePassword(newPassword, 'New password');

    // Validasi password tidak sama dengan yang lama
    if (currentPassword === newPassword) {
        throw new AppError(
            'New password must be different from current password',
            400,
            ErrorCodes.VALIDATION_ERROR
        );
    }

    // Cari user dan validasi
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
        throw new AppError(
            'User not found',
            404,
            ErrorCodes.USER_NOT_FOUND
        );
    }

    // Validasi password lama
    const isCorrectPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isCorrectPassword) {
        throw new AppError(
            'Current password is incorrect',
            401,
            ErrorCodes.INVALID_CREDENTIALS
        );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate token baru
    const token = generateToken(user._id, user.username);

    console.info(`Password updated successfully for user: ${user.username}`);

    res.json({
        success: true,
        message: 'Password updated successfully',
        data: {
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                lastPasswordUpdate: new Date()
            }
        }
    });
});