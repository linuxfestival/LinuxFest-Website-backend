const mongoose = require('mongoose');

async function openDatabase() {
    await mongoose.connect(process.env.MONGODB_URL + process.env.SITE_VERSION, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    });
}

async function closeDatabase() {
    await mongoose.disconnect();
}

async function initDatabase() {
    
}

module.exports = {
    initDatabase,
    openDatabase,
    closeDatabase
}
