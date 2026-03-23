async function invalidatePostCache(req, input) {
    const keys = await req.redisClient.keys('posts:*');

    if (keys.length > 0) {
        await req.redisClient.del(...keys);
    }

    if (input) {
        await req.redisClient.del(`post:${input}`);
    }
}

module.exports = invalidatePostCache;