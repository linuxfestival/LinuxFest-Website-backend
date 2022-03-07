const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SIGN_TOKEN } = require('./../config/index.js')

const superUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        toLower: true,
        minlength: 5
    },
    password: {
        type: String,
        required: true
    },
    permissions: [{
        permission: {
            type: String,
            required: true
        }
    }],
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
});

superUserSchema.statics.findByCredentials = async (username, password) => {
    const admin = await SuperUser.findOne({ username });

    if (!admin) {
        throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
        throw new Error('Unable to login');
    }

    return admin;
}

superUserSchema.methods.generateAuthToken = async function () {
    const admin = this;
    const token = jwt.sign({ _id: admin._id.toString() }, SIGN_TOKEN, { expiresIn: '7 days' });

    admin.tokens = admin.tokens.concat({ token });
    await admin.save();

    return token;
}

superUserSchema.pre('save', async function (next) {
    const superUser = this;

    if (superUser.isModified('password')) {
        superUser.password = await bcrypt.hash(superUser.password, 8);
    }

    next();
});

superUserSchema.methods.toJSON = function () {
    const admin = this;
    const adminObject = admin.toObject();

    delete adminObject.password;
    delete adminObject.tokens;

    return adminObject;
}

const SuperUser = new mongoose.model('SuperUser', superUserSchema);

module.exports = SuperUser;