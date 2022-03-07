const { PORT } = require('./config/index.js')

const app = require('./app');
const connectDB = require('./db/mongoose.js');

connectDB().then(()=>{
    console.log('DB connected');
    
    app.listen(PORT, () => {
        console.log('Server is up and running on port: ' + PORT);
    });
})