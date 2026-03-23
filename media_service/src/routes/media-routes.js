const express = require('express');
const multer = require('multer');

const { uploadMedia, getMedia } = require('../controllers/media-controller.js');
const  authenticateRequest  = require("../middleware/auth-middleware.js");
const logger = require("../utils/logger.js");


const router = express.Router();

// Configure multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
}).single('file');

router.post(
    '/upload',
    authenticateRequest,
    (req, res, next) => {
        upload(req, res, function (err) {

            if (err instanceof multer.MulterError) {
                logger.error('Multer error while uploading', err);
                return res.status(400).json({
                    message: 'Multer error while uploading',
                    error: err.message
                });
            }

            if (err) {
                logger.error('Unknown error occurred while uploading', err);
                return res.status(500).json({
                    message: 'Unknown error occurred while uploading',
                    error: err.message
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    message: 'No file uploaded'
                });
            }

            next();
        });
    },
    uploadMedia
);

router.get('/get',authenticateRequest, getMedia)



module.exports = router;