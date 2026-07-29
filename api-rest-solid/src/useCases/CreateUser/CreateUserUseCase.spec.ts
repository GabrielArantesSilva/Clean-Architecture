import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IHashProvider } from "../../providers/IHashProvider.js";
import type { IMailProvider, IMessage } from "../../providers/IMailProvider.js";
import { InMemoryUsersRepository } from "../../repositories/implementations/InMemoryUsersRepository.js";
import { CreateUserUseCase } from "./CreateUserUseCase.js";
import { UserAlreadyExistsError } from "./UserAlreadyExistsError.js";

class FakeMailProvider implements IMailProvider {
    public sentMessages: IMessage[] = [];

    async sendMail(message: IMessage): Promise<void> {
        this.sentMessages.push(message);
    }
}

class FakeHashProvider implements IHashProvider {
    async hash(payload: string): Promise<string> {
        return `hashed:${payload}`;
    }
}

describe("CreateUserUseCase", () => {
    let usersRepository: InMemoryUsersRepository;
    let mailProvider: FakeMailProvider;
    let hashProvider: FakeHashProvider;
    let sut: CreateUserUseCase;

    beforeEach(() => {
        usersRepository = new InMemoryUsersRepository();
        mailProvider = new FakeMailProvider();
        hashProvider = new FakeHashProvider();
        sut = new CreateUserUseCase(usersRepository, mailProvider, hashProvider);
    });

    it("should create a new user with a hashed password", async () => {
        await sut.execute({
            name: "John Doe",
            email: "john@example.com",
            password: "123456",
        });

        const user = await usersRepository.findByEmail("john@example.com");

        expect(user).not.toBeNull();
        expect(user?.password).not.toBe("123456");
        expect(user?.password).toBe("hashed:123456");
    });

    it("should send a welcome email to the new user", async () => {
        await sut.execute({
            name: "John Doe",
            email: "john@example.com",
            password: "123456",
        });

        expect(mailProvider.sentMessages).toHaveLength(1);
        expect(mailProvider.sentMessages[0]?.to.email).toBe("john@example.com");
    });

    it("should not create a user with an email that already exists", async () => {
        await sut.execute({
            name: "John Doe",
            email: "john@example.com",
            password: "123456",
        });

        await expect(
            sut.execute({
                name: "Another John",
                email: "john@example.com",
                password: "654321",
            })
        ).rejects.toBeInstanceOf(UserAlreadyExistsError);
    });

    it("should not create a user with an email that already exists in a different case", async () => {
        await sut.execute({
            name: "John Doe",
            email: "John@Example.com",
            password: "123456",
        });

        await expect(
            sut.execute({
                name: "Another John",
                email: "john@example.com",
                password: "654321",
            })
        ).rejects.toBeInstanceOf(UserAlreadyExistsError);
    });

    it("should store the user email in lowercase", async () => {
        await sut.execute({
            name: "John Doe",
            email: "John@Example.com",
            password: "123456",
        });

        const user = await usersRepository.findByEmail("john@example.com");
        expect(user?.email).toBe("john@example.com");
    });

    it("should still create the user even if sending the welcome email fails", async () => {
        vi.spyOn(mailProvider, "sendMail").mockRejectedValueOnce(new Error("SMTP down"));

        await expect(
            sut.execute({
                name: "John Doe",
                email: "john@example.com",
                password: "123456",
            })
        ).resolves.not.toThrow();

        const user = await usersRepository.findByEmail("john@example.com");
        expect(user).not.toBeNull();
    });
});
