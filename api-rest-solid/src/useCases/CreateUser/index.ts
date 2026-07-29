import { BcryptHashProvider } from "../../providers/implementations/BcryptHashProvider.js";
import { MailtrapMailProvider } from "../../providers/implementations/MailtrapMailProvider.js";
import { PrismaUsersRepository } from "../../repositories/implementations/PrismaUsersRepository.js";
import { CreateUserController } from "./CreateUserController.js";
import { CreateUserUseCase } from "./CreateUserUseCase.js";

const mailTrapMailProvider = new MailtrapMailProvider();
const usersRepository = new PrismaUsersRepository();
const hashProvider = new BcryptHashProvider();

const createUserUseCase = new CreateUserUseCase(
    usersRepository,
    mailTrapMailProvider,
    hashProvider
);

const createUserController = new CreateUserController(
    createUserUseCase
);

export {createUserUseCase, createUserController}