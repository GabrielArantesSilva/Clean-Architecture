import bcrypt from "bcrypt";
import type { IHashProvider } from "../IHashProvider.js";

const SALT_ROUNDS = 10;

export class BcryptHashProvider implements IHashProvider {
    async hash(payload: string): Promise<string> {
        return bcrypt.hash(payload, SALT_ROUNDS);
    }
}
