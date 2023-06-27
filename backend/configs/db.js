const mongoose = require('mongoose');
require('dotenv').config();

const connection = async()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connection with MongoDB established');
    } catch (err) {
        console.log('Something went wrong with the db connection');
    }
}

module.exports = connection;
