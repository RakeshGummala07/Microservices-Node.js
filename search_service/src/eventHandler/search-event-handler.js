const Search = require("../models/Search")


async function  handlePostCreated(event) {
    try{
        const newSearchPost = new Search({
            postId : event.postId,
            userId : event.userId,
            content : event.content,
            createdAt : event.createdAt
        });

        await newSearchPost.save();
        logger.info(`Search post created : ${event.postId}, ${newSearchPost._id.toString()}`);
    }catch(e){
        logger.error("Error handling post creation event")
    }
}

async function handlePostDeleted(event){

    try {
        await Search.findOneAndDelete({postId : event.postId});
        logger.info(`Sarch post deleted ${event.postId}`);
    }catch(e){
        logger.error("Error handling post creation event")
    }
}

module.exports = {handlePostCreated, handlePostDeleted}