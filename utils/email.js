/* eslint-disable */
//insll nodemailer: npm i nodemailer
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlTotext = require('html-to-text');

module.exports = class Email{

    constructor(user, url){
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Jerry Austria <${process.env.EMAIL_FROM}>`;
    }

    newTransport(){
        if(process.env.NODE_ENV === 'production'){
            // SendGrid
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth:{
                    user:process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }
            });
        }

        return nodemailer.createTransport({
            host:process.env.EMAIL_HOST,
            port:process.env.EMAIL_PORT,
            auth:{
                user:process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
            //Activate in gmail "less secure app" option
        });
    }

    async send(template,subject){
        //1. Render HTML based on PUG template
       const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, 
        {
            firstName: this.firstName,
            url: this.url,
            subject
            }
       );

        //2. Define email options
        const options = {
            wordwrap: 130,
            // ...
          };

        const mailOptions = {
            from: this.from,
            to:this.to,
            subject,
            html,
            text: htmlTotext.fromString(html) // install npm i html-to-text
            // html:
        };
        // 3 Create a transport and send email
    
        await this.newTransport().sendMail(mailOptions,(err, result) => {
            if (err){
           // console.log(err)
            console.log(result.envelope);
            console.log(result.messageId);

                res.json('Opps error occured')
            } else{
                console.log(err)
                console.log(result.envelope);
            console.log(result.messageId); 
                res.json('thanks for e-mailing me');
            }
        });
    }

    async sendWelcome(){
        await this.send('welcome', 'Welcome to the Tommo Store');
    }

    async sendPasswordReset(){
        await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes).');
    }
};
