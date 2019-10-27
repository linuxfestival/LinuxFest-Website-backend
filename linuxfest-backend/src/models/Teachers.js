const mongoose = require('mongoose');

const schema = mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        unique: true,
        trim = true
    },
    description: {
        type: String
    },
    imagePath: {
        type: String
    },
    workshops: [{
        workshop: {
            type: mongoose.Types.ObjectId,
            required: true
        }
    }]
},{
    timestamps: true
});

const Teacher = new mongoose.model('Teacher', schema);

module.exports = Teacher;