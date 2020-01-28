const path = require('path');
const express = require('express');
const { baseURL } = require('./utils/consts');

//const cors = require('cors');

const app = express();

//app.use(cors());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
});

app.use(express.json());
app.use(express.urlencoded({extended : false}));

app.use(`${baseURL}/almightyone`, require('./routers/superuser'));
app.use(`${baseURL}/users`, require('./routers/user'));
app.use(`${baseURL}/workshops`, require('./routers/workshop'));
app.use(`${baseURL}/teachers`, require('./routers/teacher'));
app.use(`${baseURL}/statics`, require('./routers/static'));

app.use(`${baseURL}/uploads`, express.static(path.join(__dirname, '../../uploads')))

module.exports = app;