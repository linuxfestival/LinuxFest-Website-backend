
require("dotenv").config();
const path = require('path');

module.exports = {
    BASEURL: process.env.BASEURL,
    PORT: process.env.PORT,
    MONGOURL: process.env.MONGOURL,
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
    UPLOAD_PATH: path.join(process.env.PWD, "uploads",  process.env.SITE_VERSION)
}