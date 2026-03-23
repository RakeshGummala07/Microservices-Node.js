const mongoose = require('mongoose');

const searchPostSchema = new mongoose.Schema({
    postId : {
        type : String,
        required  : true,
        unique : true
    },
    userId : {
        type : String,
        required  : true,
        index : true
    },
    content : {
        type : String,
        required  : true,
    },
    createdAt : {
        type : Date,
        required : true,
    }
}, {timestamps : true})

searchPostSchema.index({content : 'text'})
searchPostSchema.index({createdAt : 'text'})

const Search = mongoose.model('Serach', searchPostSchema);

module.exports = Search;