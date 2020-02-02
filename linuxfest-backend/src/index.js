var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', { flags: 'w' });
var log_stdout = process.stdout;

console.log = function (d) {
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
};

const app = require('./app');
require('../db/mongoose');

const PORT = process.env.PORT;

app.get("/log", async (req, res) => {
    res.send(fs.readFileSync(__dirname + "/debug.log").toString());
});

app.listen(PORT, () => {
    console.log('Server is up and running on port: ' + PORT);
});