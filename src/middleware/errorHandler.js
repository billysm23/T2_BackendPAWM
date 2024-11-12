const AppError = require('../utils/errors/AppError');
const ErrorCodes = require('../utils/errors/errorCodes');
const mongoose = require('mongoose');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400, ErrorCodes.INVALID_INPUT);
};

const handleDuplicateFieldsDB = err => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${value} for field ${field}. Please use another value!`;
    return new AppError(message, 400, ErrorCodes.RESOURCE_EXISTS);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400, ErrorCodes.VALIDATION_ERROR);
};

const handleJWTError = () => 
    new AppError('Invalid token. Please log in again!', 401, ErrorCodes.TOKEN_INVALID);

const handleJWTExpiredError = () => 
    new AppError('Your token has expired! Please log in again.', 401, ErrorCodes.TOKEN_EXPIRED);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        error: {
            code: err.errorCode,
            status: err.status,
            message: err.message,
            isOperational: err.isOperational,
            stack: err.stack,
            details: err
        }
    });
};

const isOperationalError = (err) => {
    if (err instanceof AppError) return true;
    if (err instanceof mongoose.Error.ValidationError) return true;
    if (err instanceof mongoose.Error.CastError) return true;
    if (err.name === 'JsonWebTokenError') return true;
    if (err.name === 'TokenExpiredError') return true;
    if (err.code === 11000) return true;
    if (err.type === 'entity.parse.failed') return true;
    if (err.name === 'MulterError') return true;
    return false;
};

const normalizeError = (err) => {
    if (err instanceof AppError) {
        return err;
    }
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    error.code = err.code;

    if (error instanceof mongoose.Error.CastError) {
        error = handleCastErrorDB(error);
    } else if (error.code === 11000) {
        error = handleDuplicateFieldsDB(error);
    } else if (error instanceof mongoose.Error.ValidationError) {
        error = handleValidationErrorDB(error);
    } else if (error.name === 'JsonWebTokenError') {
        error = handleJWTError();
    } else if (error.name === 'TokenExpiredError') {
        error = handleJWTExpiredError();
    } else if (error.type === 'entity.parse.failed') {
        error = handleSyntaxError(error);
    } else if (error.name === 'MulterError') {
        error = handleMulterError(error);
    }

    return error;
};

const sendErrorProd = (err, res) => {
    const isOperational = isOperationalError(err);
    // Operasional: beri tahu user
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.errorCode,
                message: err.message
            }
        });
    } 
    // Programming atau error lainnya: tidak beri tahu user
    else {
        // Log error
        console.error('ERROR 💥', {
            timestamp: new Date().toISOString(),
            error: err,
            stack: err.stack
        });
        
        res.status(500).json({
            success: false,
            error: {
                code: ErrorCodes.INTERNAL_SERVER_ERROR,
                message: 'Something went wrong! Please try again later.'
            }
        });
    }
};

const errorHandler = (err, req, res, next) => {
    // Default error status
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    const normalizedError = normalizeError(err);
    
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(normalizedError, res);
    } else {
        sendErrorProd(normalizedError, res);
    }

    // Error 500 untuk monitoring
    if (err.statusCode === 500) {
        console.error('Internal Server Error:', {
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method,
            error: err,
            stack: err.stack
        });
    }
};

module.exports = errorHandler;