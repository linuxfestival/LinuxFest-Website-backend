
require("dotenv").config();
const path = require('path');

const { NODE_ENV, MONGOURL: env_mongo_url } = process.env;
let MONGO_URL;

if (NODE_ENV === 'production') {
    const MONGO_IP = process.env.MONGO_IP || "mongo",
        MONGO_PORT = process.env.MONGO_PORT || 27017,
        MONGO_USER = process.env.MONGO_USER,
        MONGO_PASSWORD = process.env.MONGO_PASSWORD;

    MONGO_URL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/linux-fest?authSource=admin`;
} else {
    MONGO_URL = env_mongo_url;
}

module.exports = {
    BASEURL: process.env.BASEURL,
    PORT: process.env.PORT,
    MONGOURL: MONGO_URL,
    ALLOWED_HOSTS: String(process.env.ALLOWED_HOSTS).trim().split(" "),
    SUPER_TOKEN_SIGN: process.env.SUPER_TOKEN_SIGN,
    SIGN_TOKEN: process.env.SIGN_TOKEN,
    SITE_VERSION: process.env.SITE_VERSION,
    FRONTURL: process.env.FRONTURL,
    MAILHOST: process.env.MAILHOST,
    MAILUSER: process.env.MAILUSER,
    MAILPASS: process.env.MAILPASS,
    ZARIN: process.env.ZARIN,
    RANDOM: parseInt(process.env.RANDOM),
    workingDir: process.env.PWD,
    UPLOAD_PATH: path.join(process.env.PWD, "uploads", process.env.SITE_VERSION)
}