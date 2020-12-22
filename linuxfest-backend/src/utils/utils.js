const fs = require('fs');

const nodemailer = require("nodemailer");
const CryptoJS = require('crypto-js');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ceit.linuxfest@gmail.com',
        pass: process.env.MAIL_PASSWORD
    }
});

function checkPermission(admin, perm, res) {
    console.log(admin.permissions.filter(permission => permission.permission === perm));
    if (!admin.permissions.filter(permission => permission.permission === perm).length) {
        res.status(401).send({ error: "You don't have permission to do that" });
        return false;
    } else {
        return true;
    }
}

async function sendWelcomeEmail(user) {
    let html;
    try {
        html = fs.readFileSync("./mails/register.html").toString();
    } catch (err) {
        html = "Welcome to linuxfest";
    }
    const mailOptions = {
        from: '"CEIT Linux Festival" <ceit.linuxfest@gmail.com>',
        to: user.email,
        subject: 'Welcome to Linux Festival!',
        html: html
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
}

async function sendForgetPasswordEmail(user, token) {

    let html;
    const link = `${process.env.SITE}user/forget/${token}`
    try {
        html = fs.readFileSync("./mails/password.html").toString();
        html = html.replace("<<<LINK_TO_RESET>>>", link);
    } catch (err) {
        html = link;
    }

    const mailOptions = {
        from: '"CEIT Linux Festival" <ceit.linuxfest@gmail.com>',
        to: user.email,
        subject: 'Password reset',
        html: html
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
}

function redirectTo(res, url, data) {
    const dt = CryptoJS.AES.encrypt(JSON.stringify(data), "simple-secret").toString();
    res.redirect(url + "?data=" + dt);
}

module.exports = {
    checkPermission,
    sendWelcomeEmail,
    sendForgetPasswordEmail,
    redirectTo
}