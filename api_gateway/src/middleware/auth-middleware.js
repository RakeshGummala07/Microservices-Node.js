const logger = require('../utils/logger.js');
const jwt = require('jsonwebtoken');

const validateToken = (req, res, next) => {

    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logger.warn("Access attempt without valid token");
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    const token = authHeader.split(" ")[1];


        

        try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
       
        

        next();

    } catch (err) {

        logger.warn("Invalid token!", err.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

module.exports = validateToken;