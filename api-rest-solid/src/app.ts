import express, {type Express, type Request, type Response, type NextFunction} from "express";
import { router } from "./router.js";
import { AppError } from "./errors/AppError.js";

const app: Express = express();

app.disable("x-powered-by");
app.use(express.json());
app.use(router);

app.use((err: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
        response.status(err.statusCode).json({ message: err.message });
        return;
    }

    console.error(err);
    response.status(500).json({ message: "Internal server error." });
});

export { app };