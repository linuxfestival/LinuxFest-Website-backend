const mongoose = require('mongoose');
const Teacher = require('./Teacher');

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
    price: {
        type: Number,
        required: true
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
    times: [{
        startTime: {
            type: Date,
            required: true
        },
        endTime: {
            type: Date,
            required: true
        }
    }],
    participantsNumber: {
        type: Number,
        default: 0
    },
    teachers: [{
        id: {
            type: mongoose.Types.ObjectId,
            required: true
        },
        name: {
            type: String,
        }
    }]
});

schema.virtual('participants', {
    ref: 'User',
    localField: '_id',
    foreignField: 'workshops.workshop'
});

schema.pre("save", async function (next) {
    const workshop = this;

    if (workshop.isModified("teachers")) {
        for (const obj of workshop.teachers) {
            const id = obj.id;
            const teacher = await Teacher.findById(id);
            obj.name = teacher.fullName
        }
    }
    next();
});

const Workshop = new mongoose.model('Workshop', schema);

module.exports = Workshop;