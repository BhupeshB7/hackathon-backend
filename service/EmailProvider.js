import { EmailService } from "./EmailService.js";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import handlebars from "handlebars";
const EMAIL = "powerfulindia850@gmail.com";
const PASSWORD = "pqyc aidu fqcw sdod";

export class EmailProvider extends EmailService {
  constructor() {
    super();

    this.transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || EMAIL,
        pass: process.env.EMAIL_PASSWORD || PASSWORD,
      },
    });

    const templatePath = path.join(
      process.cwd(),
      "templates",
      "otp-email.html"
    );
    this.template = fs.readFileSync(templatePath, "utf8");

    this.compiledTemplate = handlebars.compile(this.template);
  }

  async sendEmail(email, OTP) {
    const data = {
      otp: OTP,
      year: new Date().getFullYear(),
      userName: email.split("@")[0],
    };

    const html = this.compiledTemplate(data);

    const info = await this.transport.sendMail({
      from: {
        name: "Drive Storage Service",
        address: process.env.EMAIL_USER || EMAIL,
      },
      to: email,
      subject: "Your Verification Code",
      text: `Your verification code is: ${OTP}. Please enter this code to complete your registration.`,
      html: html,
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  }

  async verifyOTP(email, userProvidedOTP, storedOTP) {
    return userProvidedOTP === storedOTP;
  }
}
