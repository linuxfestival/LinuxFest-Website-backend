const mongoose = require('mongoose');
const persianize = require('persianize');

const schema = mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate(values) {
            for (const value of values.split(' ')) {
                if (!persianize.validator().alpha(value)) {
                    throw new Error('نام معتبر نمیباشد')
                }
            }
        }
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