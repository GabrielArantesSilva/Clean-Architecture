import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { CreateUserController } from "./CreateUserController.js";
import type { CreateUserUseCase } from "./CreateUserUseCase.js";

function makeResponse() {
    const response = {
        statusCode: 0,
        body: undefined as unknown,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(payload: unknown) {
            this.body = payload;
            return this;
        },
        send() {
            return this;
        },
    };

    return response as unknown as Response & { statusCode: number; body: unknown };
}

describe("CreateUserController", () => {
    it("should return 400 when the request body is invalid", async () => {
        const useCase = { execute: vi.fn() } as unknown as CreateUserUseCase;
        const controller = new CreateUserController(useCase);
        const response = makeResponse();
        const next = vi.fn() as NextFunction;

        await controller.handle(
            { body: { name: "", email: "not-an-email", password: "123" } } as Request,
            response,
            next
        );

        expect(response.statusCode).toBe(400);
        expect(useCase.execute).not.toHaveBeenCalled();
    });

    it("should return 201 when the user is created", async () => {
        const useCase = { execute: vi.fn().mockResolvedValue(undefined) } as unknown as CreateUserUseCase;
        const controller = new CreateUserController(useCase);
        const response = makeResponse();
        const next = vi.fn() as NextFunction;

        await controller.handle(
            { body: { name: "John Doe", email: "john@example.com", password: "123456" } } as Request,
            response,
            next
        );

        expect(useCase.execute).toHaveBeenCalledWith({
            name: "John Doe",
            email: "john@example.com",
            password: "123456",
        });
        expect(response.statusCode).toBe(201);
    });

    it("should forward use case errors to next", async () => {
        const error = new Error("boom");
        const useCase = { execute: vi.fn().mockRejectedValue(error) } as unknown as CreateUserUseCase;
        const controller = new CreateUserController(useCase);
        const response = makeResponse();
        const next = vi.fn();

        await controller.handle(
            { body: { name: "John Doe", email: "john@example.com", password: "123456" } } as Request,
            response,
            next as NextFunction
        );

        expect(next).toHaveBeenCalledWith(error);
    });
});
