const sgMail = require('@sendgrid/mail');

const sgApiKey = process.env.SGAPIKEY;

sgMail.setApiKey(sgApiKey);

const sendWelcome = (email, name) => {
    sgMail.send({
        to: email,
        from: 'info@itlomax.co.uk',
        subject: 'Welcome to task manager app!',
        text: `Welcome to the app, ${name}!\n\nWe're glad to have you and we hope you will enjoy using it! Please do not hesitate to email us with any feedback or suggestions you might have.\n\nBest wishes,\nAdmin of itlomax.co.uk`
    })
}

const sendFarewell = (email, name) => {
    sgMail.send({
        to: email,
        from: 'info@itlomax.co.uk',
        subject: 'Account deletion',
        text: `Dear ${name}\n\nWe're sorry to see you go. We hope you have enjoyed the app and we will look forward to having you with us soon!\n\nBest wishes,\nAdmin of itlomax.co.uk`
    })
}

module.exports = {
    sendWelcome,
    sendFarewell
}