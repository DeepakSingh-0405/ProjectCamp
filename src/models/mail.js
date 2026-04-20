import Mailgen from 'mailgen';
import nodemailer from 'nodemailer';


//this is the function that will send the email using nodemailer and mailgen. It will take an options object that will contain the email, subject, and mailgen content that we want to send in the email.
const sendEmail = async (options) => {
    const mailgenerator = new Mailgen({
        theme: 'default',
        product: {
            name: "projectCamp",
            link: 'https://projectCap.com'
        }
    })
    const emailTextual = mailgenerator.generatePlaintext(options.mailgenContent);
    const emailHtml = mailgenerator.generate(options.mailgenContent);

    //this is a transporter which has the configurations of mailtrap(an email testing service)
    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS
        }
    })

    const mail = {
        from: 'projectCamp@mail.com',
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHtml
    }

    try {
        await transporter.sendMail(mail);
    } catch (error) {
        console.error("Email Sending Failed. Please check the configurations(options) that you send! :", error);
    }
}


//these are the Mailgen content generator functions that will generate the content for the email based on the type of email we want to send and the data we want to include in the email.
const emailVerificationMailGenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: 'Welcome to projectCamp! We\'re very excited to have you on board.',
            action: {
                instructions: 'Verify the email by clicking below!',
                button: {
                    color: '#22BC66',
                    text: 'Confirm your account',
                    link: verificationUrl
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    };
}

const forgotPasswordMailGenContent = (username, passwordUrl) => {
    return {
        body: {
            name: username,
            intro: 'Welcome to projectCamp! We\'re very excited to have you on board.',
            action: {
                instructions: 'Reset your password by clicking below!',
                button: {
                    color: '#22BC66',
                    text: 'Reset your password',
                    link: passwordUrl
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    };
}



export {
    emailVerificationMailGenContent,
    forgotPasswordMailGenContent,
    sendEmail
}
