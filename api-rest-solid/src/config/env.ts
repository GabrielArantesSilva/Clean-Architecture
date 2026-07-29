import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().url(),
    MAILTRAP_HOST: z.string().min(1),
    MAILTRAP_PORT: z.coerce.number().int().positive(),
    MAILTRAP_USER: z.string().min(1),
    MAILTRAP_PASS: z.string().min(1),
    APP_MAIL_NAME: z.string().min(1),
    APP_MAIL_ADDRESS: z.string().email(),
});

export const env = envSchema.parse(process.env);
