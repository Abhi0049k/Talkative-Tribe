const mongoose = require('mongoose');

const chatSchema = mongoose.Schema({
    msg: {
        type: String,
        required: true
    },
    room: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
})

const chatModel = mongoose.model('chat', chatSchema);

module.exports = {
    chatModel
}
