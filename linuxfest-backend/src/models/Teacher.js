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
    localField: '_id',
    foreignField: 'teachers.teacher'
})

const Teacher = new mongoose.model('Teacher', schema);

module.exports = Teacher;