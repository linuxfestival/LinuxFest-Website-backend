const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL + process.env.SITE_VERSION, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});