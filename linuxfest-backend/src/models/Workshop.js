const mongoose = require('mongoose');

const schema = mongoose.Schema({
    capacity: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    picPath: {
        type: String,
        required: true
    },
    album: [{
        albumPicPath: {
            type: String
        }
    }],
    description: {
        type: String
    }
});

schema.virtual('teachers', {
    ref: 'Teacher',
    localField: '_id',
    foreignField: 'workshops.workshop'
});

schema.virtual('participants', {
    ref: 'User',
    localField: '_id',
    foreignField: 'workshops.workshop'
});

const Workshop = new mongoose.model('Workshop', schema);

module.exports = Workshop;