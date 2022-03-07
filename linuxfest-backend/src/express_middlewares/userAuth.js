const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {SIGN_TOKEN} = require('./../config/index.js')
async function authCheckUser(req) {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, SIGN_TOKEN);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            return false;
        }

        // eslint-disable-next-line require-atomic-updates
        req.token = token;
        // eslint-disable-next-line require-atomic-updates
        req.user = user;
        return true;
    } catch (error) {
        return false;
    }
}

const userAuth = async (req, res, next) => {
    if (await authCheckUser(req)) {
        next();
    } else {
        res.status(401).send('Please authenticate');
    }
}

module.exports = userAuth;