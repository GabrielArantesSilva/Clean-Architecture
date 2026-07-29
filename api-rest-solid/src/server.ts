import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
  return console.log(`Servidor rodando em http://localhost:${env.PORT}`)
});
