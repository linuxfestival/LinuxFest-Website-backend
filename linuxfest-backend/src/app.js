const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended : false}));


//================================== Routes ==================================\\
app.use(`/${process.env.BASEURL}`+'/almightyone', require('./routers/superuser'));
app.use(`/${process.env.BASEURL}`+'/users', require('./routers/user'));
app.use(`/${process.env.BASEURL}`+'/workshops', require('./routers/workshop'));
app.use(`/${process.env.BASEURL}`+'/teachers', require('./routers/teacher'));
app.use(`/${process.env.BASEURL}`+'/discounts', require('./routers/discount'));
app.use(`/${process.env.BASEURL}`+'/statics', require('./routers/static'));
app.use(`/${process.env.BASEURL}`+'/companies', require('./routers/company'))

module.exports = app;