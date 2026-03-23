const Joi = require('joi');

const validateCreatePost = (data) => {

    const schema = Joi.object({
        content: Joi.string()
            .min(5)
            .max(5000)
            .required()
            .messages({
                "string.base": "Content must be a string",
                "string.empty": "Content cannot be empty",
                "string.min": "Content must be at least 5 characters",
                "string.max": "Content cannot exceed 5000 characters",
                "any.required": "Content is required"
            }),
        mediaUrls : Joi.array()
    });

    return schema.validate(data, { abortEarly: false });
};

module.exports = { validateCreatePost };