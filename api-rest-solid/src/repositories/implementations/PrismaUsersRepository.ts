import { prismaClient } from "../../database/prismaClient.js";
import { User } from "../../entities/User.js";
import type { IUsersRepository } from "../IUsersRepository.js";

export class PrismaUsersRepository implements IUsersRepository {
    async findByEmail(email: string): Promise<User | null> {
        const user = await prismaClient.user.findUnique({ where: { email } });

        if (!user) {
            return null;
        }

        return new User(user, user.id);
    }

    async save(user: User): Promise<void> {
        await prismaClient.user.create({
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                password: user.password,
            },
        });
    }
}
