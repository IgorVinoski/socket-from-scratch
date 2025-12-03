import { HTTPError } from "../../../domain/use-cases/errors/http-error";
import { BodyReader } from "../../models/body-reader";
import { HTTPRequest } from "../../models/http-request";
import { HTTPResponse } from "../../models/http-response";
import { ArquivoController } from "./arquivo/arquivo-controller";
import { LoginController } from "./login/login-controller";

export class HTTPRouter {
  constructor(
    private loginController: LoginController,
    private arquivoController: ArquivoController
  ) {}

  async rotear(req: HTTPRequest, body: BodyReader): Promise<HTTPResponse> {
    const uri = req.uri.toString("latin1");

    // GET /arquivos/:nome
    if (req.method === "GET" && uri.startsWith("/arquivos/")) {
      const nome = uri.substring("/arquivos/".length);
      return this.arquivoController.handleGet(nome);
    }

    // POST /login
    if (req.method === "POST" && uri === "/login") {
      return this.loginController.handle(body);
    }

    // POST /arquivos
    if (req.method === "POST" && uri === "/arquivos") {
      const authHeader = this.extrairHeader(req.headers, "Authorization");
      if (!authHeader) {
        throw new HTTPError(401, "Autorização obrigatória");
      }
      return this.arquivoController.handlePost(body, authHeader.toString("latin1").trim());
    }

    throw new HTTPError(404, "Rota não encontrada");
  }

  private extrairHeader(headers: Buffer[], nome: string): Buffer | undefined {
    const lower = nome.toLowerCase();
    for (const h of headers) {
      const s = h.toString("latin1");
      const idx = s.indexOf(":");
      if (idx < 0) continue;
      const key = s.substring(0, idx).trim().toLowerCase();
      if (key === lower) {
        return Buffer.from(s.substring(idx + 1).trim(), "latin1");
      }
    }
    return undefined;
  }
}