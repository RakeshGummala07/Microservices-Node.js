const RefreshToken = require('../models/RefreshToken.js');
const User = require('../models/User.js');
const generateTokens = require('../utils/generateToken.js');
const logger = require('../utils/logger.js');
const { validateRegistration, validateLogin } = require('../utils/validation.js');


// User Registration
const registerUser = async (req, res) => {
    logger.info('Registration endpoint hit');

    try {

        const { error } = validateRegistration(req.body);
        if (error) {
            logger.warn('Validation error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { username, email, password } = req.body;

        let user = await User.findOne({ $or: [{ email }, { username }] });

        if (user) {
            logger.warn('User already exists');
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        user = new User({ username, email, password });
        await user.save();

        logger.info('User saved successfully', user._id);

        const { accessToken, refreshToken } = await generateTokens(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            accessToken,
            refreshToken
        });

    } catch (err) {

        logger.error('Registration error occurred', err);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// User Login
const userLogin = async (req, res) => {

    logger.info('Login endpoint hit');

    try {

        const { error } = validateLogin(req.body);

        if (error) {
            logger.warn('Validation error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            logger.warn('User does not exist');
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            logger.warn('Invalid password');
            return res.status(400).json({
                success: false,
                message: 'Invalid password'
            });
        }

        const { accessToken, refreshToken } = await generateTokens(user);

        res.json({
            success: true,
            message: "Login successful",
            userId: user._id,
            accessToken,
            refreshToken
        });

    } catch (err) {

        logger.error('Login error occurred', err);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// Refresh Token
const refreshTokenController = async (req, res) => {

    logger.info('Refresh token endpoint hit');

    try {

        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token missing"
            });
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken });

        if (!storedToken || storedToken.expiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        const user = await User.findById(storedToken.user);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            await generateTokens(user);

        await RefreshToken.deleteOne({ _id: storedToken._id });

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });

    } catch (err) {

        logger.error('Refresh token error', err);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// Logout
const userLogout = async (req, res) => {

    logger.info("Logout endpoint hit");

    try {

        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token missing"
            });
        }

        await RefreshToken.deleteOne({ token: refreshToken });

        res.json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (err) {

        logger.error('Logout error', err);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


module.exports = {
    registerUser,
    userLogin,
    refreshTokenController,
    userLogout
};