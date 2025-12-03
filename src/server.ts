import { HTTPServer } from "./infra/http-server";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const server = new HTTPServer({ port: PORT, host: "127.0.0.1" });
server.iniciar();