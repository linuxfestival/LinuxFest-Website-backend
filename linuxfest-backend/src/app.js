const express = require('express');
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

app.use(require('./routers/superuser'));
app.use(require('./routers/user'));
app.use(require('./routers/workshop'));
app.use(require('./routers/teacher'));

module.exports = app;