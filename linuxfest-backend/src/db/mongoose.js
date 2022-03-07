const mongoose = require('mongoose');
const { MONGOURL } = require('./../config/index.js');

const connectDB = async () => {
    try {
        await mongoose.connect(`${MONGOURL}`, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true
        })

        return Promise.resolve();
    }
    catch (ex) {
        return Promise.reject(ex);
    }
}

module.exports = connectDB;