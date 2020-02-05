const mongoose = require('mongoose');

const schema = mongoose.Schema({
    percentage: {
        type: Number,
        required: true,
        validate(value) {
            if(value > 100 || value < 0){
                throw new Error();
            }
        }
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    count: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

schema.statics.findByCode = async function (code) {
    const discount = await Discount.findOne({ code });
    return discount;
};

const Discount = new mongoose.model('Discount', schema);

module.exports = Discount;