const fs = require('fs');
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: `${process.env.MAILHOST}`,
    port: 587,
    auth: {
        user: `${process.env.MAILUSER}`,
        pass: `${process.env.MAILPASS}`
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
        html = fs.readFileSync("../mails/register.html").toString();
    } catch (err) {
        console.log(err)
        html = "Welcome to linuxfest";
    }
    const mailOptions = {
        from: '"CEIT Linux Festival" <linuxfest@ceit-ssc.ir>',
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


async function sendEmail(email,subject,html)
{
    return new Promise(async(resolve,reject)=>{
        const mailOptions = {
            from: '"CEIT Linux Festival" <linuxfest@ceit-ssc.ir>',
            to: email,
            subject: subject,
            html: html
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error)
                // return console.log(error)
            }
            resolve(email)
            // return email
        });
    })

}

async function sendForgetPasswordEmail(user, token) {

    let html;
    const link = `${process.env.FRONTURL}/user/forget/${token}`
    try {
        html = fs.readFileSync("../mails/password.html").toString();
        html = html.replace("<<<LINK_TO_RESET>>>", link);
    } catch (err) {
        html = link;
    }

    const mailOptions = {
        from: '"CEIT Linux Festival" <linuxfest@ceit-ssc.ir>',
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

module.exports = {
    checkPermission,
    sendWelcomeEmail,
    sendForgetPasswordEmail,
    sendEmail
}