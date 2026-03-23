const Media = require('../models/Media.js');
const { uploadMediaToCloudinary } = require('../utils/cloudinary.js');
const logger = require('../utils/logger.js');



const uploadMedia = async (req, res) => {
    logger.info('Starting media upload');

    try {

        if (!req.file) {
            logger.error('No file found, please add file!');
            return res.status(400).json({
                success: false,
                message: 'No file found. Please add a file and try again'
            });
        }

        const { originalname, mimetype, buffer } = req.file;
        const userId = req.user.userId;

        logger.info(`File details: name=${originalname}, type=${mimetype}`);
        logger.info('Uploading to Cloudinary...');

        const cloudinaryUploadRes = await uploadMediaToCloudinary(req.file);

        logger.info(`Cloudinary upload successful. Public Id: ${cloudinaryUploadRes.public_id}`);

        const newMedia = new Media({
            publicId: cloudinaryUploadRes.public_id,
            originalName: originalname,
            mimeType: mimetype,
            url: cloudinaryUploadRes.secure_url,
            userId
        });

        await newMedia.save();

        res.status(201).json({
            success: true,
            mediaId: newMedia._id,
            url: newMedia.url,
            message: 'Media uploaded successfully'
        });

    } catch (e) {
        logger.error("Error while uploading media", e);

        res.status(500).json({
            success: false,
            message: 'Error while uploading media'
        });
    }
};

const getMedia = async(req, res)=>{
    try{
        const result = await Media.find({});
        res.json({result})
    }catch(e){
        logger.error("Error fetching media", e);

        res.status(500).json({
            success: false,
            message: 'Error fetching media'
        });
    }
}

module.exports = { uploadMedia, getMedia };