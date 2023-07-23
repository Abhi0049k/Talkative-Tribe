const mongoose = require('mongoose');

const roomSchema = mongoose.Schema({
    room: {
        type: String,
        required:true
    },
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
})

const roomModel = mongoose.model('room', roomSchema);

module.exports = {
    roomModel
}