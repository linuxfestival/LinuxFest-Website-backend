const mongoose = require('mongoose');

const schema = mongoose.Schema({
    capacity: {
        type: Number,
        required: true,
        validate(value) {
            if (value < 0) {
                throw new Error('ظرفیت نمیتواند منفی باشد');
            }
        }
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    isRegOpen: {
        type: Boolean,
        default: false
    },
    picPath: {
        type: String
    },
    album: [{
        albumPicPath: {
            type: String
        }
    }],
    description: {
        type: String,
        required: true
    },
    teachers: [{
        teacher: {
            type: mongoose.Types.ObjectId,
            required: true
        }
    }]
});

schema.virtual('participants', {
    ref: 'User',
    localField: '_id',
    foreignField: 'workshops.workshop'
});

const Workshop = new mongoose.model('Workshop', schema);

module.exports = Workshop;