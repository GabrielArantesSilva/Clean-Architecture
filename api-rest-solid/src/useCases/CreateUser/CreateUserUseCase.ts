import { User } from "../../entities/User.js";
import type { IHashProvider } from "../../providers/IHashProvider.js";
import type { IMailProvider } from "../../providers/IMailProvider.js";
import { buildWelcomeUserMail } from "../../providers/mailTemplates/welcomeUserMailTemplate.js";
import type { IUsersRepository } from "../../repositories/IUsersRepository.js";
import type { ICreateUserRequestDTO } from "./CreateUserDTO.js";
import { UserAlreadyExistsError } from "./UserAlreadyExistsError.js";

export class CreateUserUseCase {
    constructor(
        private readonly usersRepository: IUsersRepository,
        private readonly mailProvider: IMailProvider,
        private readonly hashProvider: IHashProvider
    ) {}

    async execute(data: ICreateUserRequestDTO): Promise<void> {
        const email = data.email.toLowerCase();

        const userAlreadyExists = await this.usersRepository.findByEmail(email);

        if (userAlreadyExists) {
            throw new UserAlreadyExistsError();
        }

        const hashedPassword = await this.hashProvider.hash(data.password);

        const user = new User({
            name: data.name,
            email,
            password: hashedPassword,
        });

        await this.usersRepository.save(user);

        try {
            await this.mailProvider.sendMail(buildWelcomeUserMail(user));
        } catch (err) {
            console.error("Failed to send welcome email", err);
        }
    }
}
