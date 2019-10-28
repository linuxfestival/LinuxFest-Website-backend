const express = require('express');

const app = express();
app.use(express.json());

app.use(require('./routers/superuser'));
app.use(require('./routers/user'));
app.use(require('./routers/workshop'));
app.use(require('./routers/teacher'));

module.exports = app;