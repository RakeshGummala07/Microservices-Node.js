const Media = require("../models/Media.js");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary.js");
const logger = require("../utils/logger.js");

const handlePostDelete = async (event) => {
    const { postId, mediaId } = event;
    console.log(event)

    try {
        const mediaToDelete = await Media.find({
            _id: { $in: mediaId }
        });

        logger.info(`Media found: ${mediaToDelete.length}`);

        for (const media of mediaToDelete) {

            console.log("Deleting:", media.publicId);
            const result = await deleteMediaFromCloudinary(media.publicId);     
            console.log("Result:", result);
            await Media.findByIdAndDelete(media._id);
        }

        logger.info(`Completed media deletion for post ${postId}`);

    } catch (e) {
        logger.error("Error occurred while media deletion", e);
    }
};

module.exports = handlePostDelete;