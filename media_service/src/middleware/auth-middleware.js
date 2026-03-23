const logger = require("../utils/logger.js");


const authenticateRequest = (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if(!userId){
        logger.warn('Access attemted without userID');
        return res.status(401).json({
            success : false,
            message : 'Please login to continue'
        })
    }

    req.user = {userId};
    next();
}

module.exports = authenticateRequest;