import { Router } from "express";
import { createUserController } from "./useCases/CreateUser/index.js";

const router: Router = Router();

router.post('/user', (request, response, next) => {
    return createUserController.handle(request, response, next);
});

export { router };
