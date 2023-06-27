const mongoose = require('mongoose');

const roomSchema = mongoose.Schema({
    room: {
        type: String,
        required:true
    }
})

const roomModel = mongoose.model('room', roomSchema);

module.exports = {
    roomModel
}