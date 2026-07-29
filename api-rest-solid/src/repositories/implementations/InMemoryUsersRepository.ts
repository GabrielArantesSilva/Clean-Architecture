import type { User } from "../../entities/User.js";
import type { IUsersRepository } from "../IUsersRepository.js";

export class InMemoryUsersRepository implements IUsersRepository {
    private users: User[] = [];

    async findByEmail(email: string): Promise<User | null> {
        const user = this.users.find(user => user.email === email);
        return user || null;
    }

    async save(user: User): Promise<void> {
        this.users.push(user);
    }
}
