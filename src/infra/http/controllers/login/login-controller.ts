import { HTTPError } from "../../../../domain/use-cases/errors/http-error";
import { LoginUseCase } from "../../../../domain/use-cases/login/login-use-case";
import { BodyReader } from "../../../models/body-reader";
import { HTTPResponse } from "../../../models/http-response";

export class LoginController {
  constructor(private useCase: LoginUseCase) {}

  async handle(body: BodyReader): Promise<HTTPResponse> {
    const jsonData = await this.lerCorpoCompleto(body);
    
    let payload: any;
    try {
      payload = JSON.parse(jsonData.toString("utf8"));
    } catch (e) {
      throw new HTTPError(400, "JSON inválido");
    }

    const token = await this.useCase.execute(payload.username, payload.password);
    const resposta = Buffer.from(JSON.stringify({ chave: token.valor }), "utf8");

    return {
      code: 200,
      headers: [Buffer.from("Content-Type: application/json")],
      body: this.criarBodyDaMemoria(resposta),
    };
  }

  private async lerCorpoCompleto(body: BodyReader): Promise<Buffer> {
    let collected = Buffer.alloc(0);
    while (true) {
      const chunk = await body.read();
      if (chunk.length === 0) break;
      collected = Buffer.concat([collected, chunk]);
    }
    return collected;
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