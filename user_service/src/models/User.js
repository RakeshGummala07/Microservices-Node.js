const mongoose = require("mongoose");
const argon2 = require("argon2");

const userSchema = new mongoose.Schema(
{
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
},
{
    timestamps: true,
}
);

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return ;
    this.password = await argon2.hash(this.password);
    
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return argon2.verify(this.password, candidatePassword);
};

userSchema.index({ username: 'text', email: 'text' });

module.exports = mongoose.model('User', userSchema);
