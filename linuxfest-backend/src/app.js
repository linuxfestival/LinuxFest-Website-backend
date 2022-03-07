const express = require('express');
const cors = require('cors');
const { ALLOWED_HOSTS, BASEURL } = require('./config/index.js');

const app = express();

app.use(cors({
    origin: ALLOWED_HOSTS
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get("/ping", (req, res) => {
    res.send("PONG");
});


//================================== Routes ==================================\\
app.use(`/${BASEURL}/almightyone`, require('./routers/superuser'));
app.use(`/${BASEURL}/users`, require('./routers/user'));
app.use(`/${BASEURL}/workshops`, require('./routers/workshop'));
app.use(`/${BASEURL}/teachers`, require('./routers/teacher'));
app.use(`/${BASEURL}/discounts`, require('./routers/discount'));
app.use(`/${BASEURL}/statics`, require('./routers/static'));
app.use(`/${BASEURL}/companies`, require('./routers/company'))

module.exports = app;