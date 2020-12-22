const fs = require('fs');
const path = require('path');
// var util = require('util');
// var log_file = fs.createWriteStream(__dirname + '/debug.log', { flags: 'w' });
// var log_stdout = process.stdout;

// console.log = function (d) {
//     log_file.write(util.format(d) + '\n');
//     log_stdout.write(util.format(d) + '\n');
// };

const app = require('./app');
require('../db/mongoose');

const PORT = process.env.PORT;
const debug = process.env.DEBUG;

if (debug === "1") {
    app.get("/log", async (req, res) => {
        try {
            res.send(fs.readFileSync(path.join(__dirname, "../logs/out-0.log")).toString());
        } catch (err) {
            res.status(404).send("Cannot find log file");
        }
    });
}

app.listen(PORT, () => {
    console.log('Server is up and running on port: ' + PORT);
});