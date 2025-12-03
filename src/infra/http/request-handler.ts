import { IArquivoRepository } from "../../domain/repository/arquivo-repository";
import { ITokenRepository } from "../../domain/repository/token-repository";
import { HTTPError } from "../../domain/use-cases/errors/http-error";
import { BodyReader } from "../models/body-reader";
import { HTTPRequest } from "../models/http-request";
import { HTTPResponse } from "../models/http-response";
import { HTTPRouter } from "./controllers/router";

export class RequestHandler {
  constructor(
    private router: HTTPRouter,
    private arquivoRepository: IArquivoRepository,
    private tokenRepository: ITokenRepository
  ) {}

  async processar(req: HTTPRequest, body: BodyReader): Promise<HTTPResponse> {
    try {
      return await this.router.rotear(req, body);
    } catch (erro: any) {
      return this.tratarErro(erro);
    }
  }

  private tratarErro(erro: any): HTTPResponse {
    if (erro instanceof HTTPError) {
      const body = Buffer.from(erro.message + "\n");
      return {
        code: erro.code,
        headers: [Buffer.from("Content-Type: text/plain")],
        body: this.criarBodyDaMemoria(body),
      };
    }

    const body = Buffer.from("Erro interno do servidor\n");
    return {
      code: 500,
      headers: [Buffer.from("Content-Type: text/plain")],
      body: this.criarBodyDaMemoria(body),
    };
  }

  private criarBodyDaMemoria(data: Buffer): BodyReader {
    let done = false;
    return {
      length: data.length,
      read: async () => {
        if (done) return Buffer.from("");
        done = true;
        return data;
      },
    };
  }
}
