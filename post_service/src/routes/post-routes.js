const express = require("express");
const router = express.Router();

const {
    createPost,
    getAllPosts,
    getPost,
    deletePost
} = require("../controllers/post-controller.js");

const authMiddleware = require("../middleware/auth-middleware.js");

router.post("/create-post", authMiddleware, createPost);
router.get("/all-posts", getAllPosts);
router.get("/:id", getPost);
router.delete("/:id", authMiddleware, deletePost);

module.exports = router;