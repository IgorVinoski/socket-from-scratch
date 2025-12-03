import { Arquivo } from "../../../../domain/models/buisness/arquivo";
import { ArquivoUseCase } from "../../../../domain/use-cases/arquivo/arquivo-use-case";
import { HTTPError } from "../../../../domain/use-cases/errors/http-error";
import { BodyReader } from "../../../models/body-reader";
import { HTTPResponse } from "../../../models/http-response";

export class ArquivoController {
  constructor(private useCase: ArquivoUseCase) {}

  async handleGet(nome: string): Promise<HTTPResponse> {
    const arquivo = await this.useCase.obterArquivo(decodeURIComponent(nome));
    const contentBuf = Buffer.from(arquivo.conteudo, "utf8");

    return {
      code: 200,
      headers: [Buffer.from(`Content-Type: ${arquivo.tipo}`)],
      body: this.criarBodyDaMemoria(contentBuf),
    };
  }

  async handlePost(body: BodyReader, token: string): Promise<HTTPResponse> {
    const jsonData = await this.lerCorpoCompleto(body);

    let payload: any;
    try {
      payload = JSON.parse(jsonData.toString("utf8"));
    } catch (e) {
      throw new HTTPError(400, "JSON inválido");
    }

    const arquivo = new Arquivo(payload.nome, payload.conteudo, payload.tipo);
    await this.useCase.salvarArquivo(arquivo, token);

    const resposta = Buffer.from(JSON.stringify({ status: "criado" }), "utf8");
    return {
      code: 201,
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
