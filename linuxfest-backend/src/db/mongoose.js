const mongoose = require('mongoose');
const { MONGOURL } = require('./../config/index.js');

const connectDB = async () => {
    try {
        await mongoose.connect(`${MONGOURL}`, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true
        })

        await mongoose.connection.db.dropDatabase();
        console.log("Database dropped")
        return Promise.resolve();
    }
    catch (ex) {
        console.log("Connection Error (Database)")
        return Promise.reject(ex);
    }
}

module.exports = connectDB;