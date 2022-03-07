
const app = require('./app');
const connectDB = require('./db/mongoose.js');
const { PORT } = require('./config/index.js');
const logger = require('./config/logger.js');

let attempt = 0;
const MAX_ATTEMPT = 5;

const runAPI = () => {
    attempt += 1;

    connectDB().then(() => {
        logger.info('DB connected');

        app.listen(PORT, () => {
            logger.info('Server is up and running on port: ' + PORT);
        });
    }).catch((err)=>{
        logger.error(`${err} mongoDB didn't connect!`);
        if (attempt < MAX_ATTEMPT) {
            setTimeout(runApi, 10000);
        } else {
            logger.error("Exiting the process!");
            process.exit(1);
        }
    })
}


runAPI()