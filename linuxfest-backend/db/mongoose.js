const mongoose = require('mongoose');

mongoose.connect(`${process.env.MONGOURL}`, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then(()=>{
    console.log("Everything is fine")
}).catch((ex)=>{
    console.log("Connection Error (Database)")
});
