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
    users: [{
        user: {
          type: mongoose.Types.ObjectId,
          required: true,
        },
        isUsed: {
            type: Boolean,
            default: false
        },
      }],
    count: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});


schema.statics.findByCode = async function (code,userid) {
    var discount = await Discount.findOne({$and:[{ code }, { users : { $elemMatch : { user:userid , isUsed:false} } }]});
    return discount;
};

const Discount = new mongoose.model('Discount', schema);

module.exports = Discount;