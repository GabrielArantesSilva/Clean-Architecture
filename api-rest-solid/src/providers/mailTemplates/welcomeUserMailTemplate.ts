import type { IMessage } from "../IMailProvider.js";
import { env } from "../../config/env.js";

interface WelcomeUserMailData {
    name: string;
    email: string;
}

export function buildWelcomeUserMail(user: WelcomeUserMailData): IMessage {
    return {
        to: {
            email: user.email,
            name: user.name,
        },
        from: {
            email: env.APP_MAIL_ADDRESS,
            name: env.APP_MAIL_NAME,
        },
        subject: env.APP_MAIL_NAME,
        body: "<p>Seja bem-vindo ao meu App, estamos muito felizes em ter você como usuário.</p>",
    };
}
