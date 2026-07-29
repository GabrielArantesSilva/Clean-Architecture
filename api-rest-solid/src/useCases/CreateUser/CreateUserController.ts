import type { CreateUserUseCase } from "./CreateUserUseCase.js";
import type { NextFunction, Request, Response } from "express";
import { createUserRequestSchema } from "./CreateUserDTO.js";

export class CreateUserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
    const parsed = createUserRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        message: "Validation error.",
        issues: parsed.error.issues,
      });
      return;
    }

    try {
      await this.createUserUseCase.execute(parsed.data);
      response.status(201).send();
    } catch (err) {
      next(err);
    }
  }
}
