import { z } from "zod";

export const createUserRequestSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must have at least 6 characters"),
});

export type ICreateUserRequestDTO = z.infer<typeof createUserRequestSchema>;
