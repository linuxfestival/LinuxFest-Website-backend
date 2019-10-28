const mongoose = require('mongoose');

const schema = mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String
    },
    imagePath: {
        type: String
    }
}, {
    timestamps: true
});

schema.virtual('workshops', {
    ref: 'Workshop',
    foreignField: 'teachers.teacher',
    localField: '_id'
})

const Teacher = new mongoose.model('Teacher', schema);

module.exports = Teacher;