const invalidatePostCache = require("../middleware/invalidate-cache.js");
const Post = require("../models/Post");
const logger = require("../utils/logger.js");
const { validateCreatePost } = require("../utils/validation.js");
const {publishEvent} = require("../utils/rabbitmq.js")


// Create Post
const createPost = async (req, res) => {

    logger.info('Create post endpoint hit');

    try {

        // Check if body exists
        if (!req.body || Object.keys(req.body).length === 0) {
            logger.warn("Request body missing");

            return res.status(400).json({
                success: false,
                message: "Request body is missing"
            });
        }

        // Validate request body
        const { error } = validateCreatePost(req.body);

        if (error) {
            logger.warn('Validation error', error.details[0].message);

            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { content, mediaUrls } = req.body;

        // Check authentication
        if (!req.user || !req.user.userId) {
            logger.warn("Unauthorized request");

            return res.status(401).json({
                success: false,
                message: "Unauthorized request"
            });
        }

        // Create new post
        const newPost = new Post({
            user: req.user.userId,
            content,
            mediaUrls: mediaUrls || []
        });

        // Save post
        await newPost.save();

        await publishEvent('post.created', {
            postId : newPost._id.toString(),
            userId : newPost.user.toString(),
            content : newPost.content,
            createdAt : newPost.createdAt
        })

        await invalidatePostCache(req, newPost._id.toString());

        logger.info("Post created successfully", { postId: newPost._id });

        // Response
        return res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: newPost
        });

    } catch (error) {

        logger.error("Error while creating post", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};



// Get All Posts (with pagination)
const getAllPosts = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;

        // Check Redis cache
        const cachedPosts = await req.redisClient.get(cacheKey);

        if (cachedPosts) {
            return res.json(JSON.parse(cachedPosts));
        }

        // Fetch posts from database
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        const totalNoOfPosts = await Post.countDocuments();

        const result = {
            success: true,
            posts,
            currentPage: page,
            totalPages: Math.ceil(totalNoOfPosts / limit),
            totalPosts: totalNoOfPosts
        };

        // Cache result for 5 minutes
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

        res.json(result);

    } catch (error) {

        logger.error("Error while fetching posts", error);

        res.status(500).json({
            success: false,
            message: "Error while fetching posts"
        });
    }
};





// Get Single Post
const getPost = async (req, res) => {
    try {

        const postId = req.params.id;
        const cacheKey = `post:${postId}`;

        const cachedPost = await req.redisClient.get(cacheKey);

        if (cachedPost) {
            return res.json(JSON.parse(cachedPost));
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(post));

        res.json(post);

    } catch (e) {
        logger.error("Error while fetching post", e);

        res.status(500).json({
            success: false,
            message: "Error while fetching post"
        });
    }
};



// Delete Post
const deletePost = async (req, res) => {
    try {

        const postId = req.params.id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Only owner can delete (Authorization)
        if (post.user.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this post"
            });
        }

        await Post.findByIdAndDelete(postId);
        await invalidatePostCache(req, post._id.toString());

        //Publish post delete 
        await publishEvent('post.deleted',{

            postId : post._id,
            userId : req.user.userId,
            mediaId : post.mediaUrls
        
        })

        res.status(200).json({
            success: true,
            message: "Post deleted successfully"
        });

    } catch (e) {
        logger.error("Error while deleting post", e);

        res.status(500).json({
            success: false,
            message: "Error while deleting post"
        });
    }
};



module.exports = {
    createPost,
    getAllPosts,
    getPost,
    deletePost
};