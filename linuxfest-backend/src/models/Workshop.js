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

schema.virtual('participantsCount').get(async function() {
    // console.log(await this.populate('participants').execPopulate().participants);
    return (await this.populate('participants').execPopulate()).participants.length;
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
    if (!this.isNew) {
        if ((await workshop.participantsCount) >= workshop.capacity) {
            workshop.isRegOpen = false;
        }
    }
    next();
});

schema.methods.toJSON = function () {
    const workshop = this;
    const workshopObject = workshop.toObject();
    //TODO: FIX HERE TO GET WORKSHOP PICTURE
    const url = `/uploads/${process.env.SITE_VERSION}/workshops/${workshopObject._id}`;
    if (workshopObject.picPath) {
        workshopObject.picUrl = url + '/mainPic.png';
    }
    if (workshopObject.album.length) {
        workshopObject.albumUrls = [];
        for (const pic of workshop.album) {
            workshopObject.albumUrls = workshopObject.albumUrls.concat(url + "/album/" + pic._id + ".png");
        }
    }
    
    delete workshopObject.picPath;
    delete workshopObject.album;
    return workshopObject;
};

const Workshop = new mongoose.model('Workshop', schema);

module.exports = Workshop;