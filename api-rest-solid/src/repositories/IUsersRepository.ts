import type { User } from "../entities/User.js";

export interface IUsersRepository {
    findByEmail(email: string): Promise<User | null>;
    save(user: User): Promise<void>;
}