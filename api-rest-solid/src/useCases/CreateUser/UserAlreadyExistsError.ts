import { AppError } from "../../errors/AppError.js";

export class UserAlreadyExistsError extends AppError {
    constructor() {
        super("User already exists", 409);
    }
}
