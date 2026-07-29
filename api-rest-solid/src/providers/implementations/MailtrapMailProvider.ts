import type Mail from "nodemailer/lib/mailer/index.js";
import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import type { IMailProvider, IMessage } from "../IMailProvider.js";

export class MailtrapMailProvider implements IMailProvider {
    private readonly transporter: Mail;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: env.MAILTRAP_HOST,
            port: env.MAILTRAP_PORT,
            auth: {
                user: env.MAILTRAP_USER,
                pass: env.MAILTRAP_PASS
            }
        });
    }
    async sendMail(message: IMessage): Promise<void> {
        await this.transporter.sendMail({
            to: {
                name: message.to.name,
                address: message.to.email
            },
            from: {
                name: message.from.name,
                address: message.from.email
            },
            subject: message.subject,

            html: message.body
        });
    }
}