import { createServer, Server, Socket } from "net";
import { Usuario } from "../domain/models/buisness/usuario";
import { ArquivoUseCase } from "../domain/use-cases/arquivo/arquivo-use-case";
import { HTTPError } from "../domain/use-cases/errors/http-error";
import { LoginUseCase } from "../domain/use-cases/login/login-use-case";
import { ArquivoRepositoryMemory } from "./data/arquivo-repository-memory";
import { TokenRepositoryMemory } from "./data/token-repository-memory";
import { BufferUtils } from "./http/buffer-utils";
import { ArquivoController } from "./http/controllers/arquivo/arquivo-controller";
import { LoginController } from "./http/controllers/login/login-controller";
import { HTTPRouter } from "./http/controllers/router";
import { HTTPEncoder } from "./http/http-encoder";
import { HTTPParser } from "./http/http-parser";
import { RequestHandler } from "./http/request-handler";
import { TCPConnectionManager } from "./http/tcp-connection-manager";
import { BodyReader } from "./models/body-reader";
import { DynamicBuffer } from "./models/dynamic-buffer";
import { HTTPRequest } from "./models/http-request";
import { HTTPResponse } from "./models/http-response";
import { TCPConnection } from "./models/tcp-connection";

export class HTTPServer {
  private server: Server;
  private requestHandler: RequestHandler;

  constructor(private config: { port: number; host: string }) {
    const tokenRepository = new TokenRepositoryMemory();
    const arquivoRepository = new ArquivoRepositoryMemory();

    this.requestHandler = new RequestHandler(
      new HTTPRouter(
        new LoginController(
          new LoginUseCase(new Usuario("admin", "senha123"), tokenRepository)
        ),
        new ArquivoController(
          new ArquivoUseCase(arquivoRepository, tokenRepository)
        )
      ),
      arquivoRepository,
      tokenRepository
    );

    this.server = this.inicializar();
  }

  private inicializar(): Server {
    return createServer({ pauseOnConnect: true }, (socket: Socket) => {
      this.novaConexao(socket).catch((e) => console.error("Erro na conexão:", e));
    });
  }

  private async novaConexao(socket: Socket): Promise<void> {
    const conn = TCPConnectionManager.criar(socket);
    const buf: DynamicBuffer = { data: Buffer.alloc(0), length: 0 };

    try {
      while (true) {
        let msg = HTTPParser.cortarMensagem(buf);
        if (!msg) {
          const data = await TCPConnectionManager.ler(conn);
          if (data.length === 0 && buf.length === 0) return;
          if (data.length === 0) throw new HTTPError(400, "EOF inesperado");
          BufferUtils.push(buf, data);
          continue;
        }

        const resp = await this.processarRequisicao(msg, buf, conn);
        await this.enviarResposta(conn, resp);

        const shouldClose = msg.version === "1.0" || this.deveFechar(msg);
        if (shouldClose) return;
      }
    } catch (exc: any) {
      console.error("Exceção:", exc);
      if (exc instanceof HTTPError) {
        await this.enviarRespostaErro(conn, exc);
      }
    } finally {
      socket.destroy();
    }
  }

  private async processarRequisicao(
    msg: HTTPRequest,
    buf: DynamicBuffer,
    conn: TCPConnection
  ): Promise<HTTPResponse> {
    const bodyLen = this.extrairContentLength(msg.headers);
    const body = this.criarBodyReader(conn, buf, bodyLen);
    
    return this.requestHandler.processar(msg, body);
  }

  private async enviarRespostaErro(conn: TCPConnection, erro: HTTPError): Promise<void> {
    const resp: HTTPResponse = {
      code: erro.code,
      headers: [Buffer.from("Content-Type: text/plain")],
      body: this.criarBodyDaMemoria(Buffer.from(erro.message + "\n")),
    };
    
    try {
      await this.enviarResposta(conn, resp);
    } catch (erroEnvio) {
      console.error("Falha ao enviar resposta de erro:", erroEnvio);
    }
  }

  private async enviarResposta(conn: TCPConnection, resp: HTTPResponse): Promise<void> {
    if (!this.temContentLength(resp.headers)) {
      resp.headers.push(Buffer.from(`Content-Length: ${resp.body.length}`));
    }
    if (!this.temServer(resp.headers)) {
      resp.headers.push(Buffer.from("Server: clean-http-server"));
    }

    await TCPConnectionManager.escrever(conn, HTTPEncoder.encode(resp));
    while (true) {
      const data = await resp.body.read();
      if (data.length === 0) break;
      await TCPConnectionManager.escrever(conn, data);
    }
  }

  private criarBodyReader(conn: TCPConnection, buf: DynamicBuffer, bodyLen: number): BodyReader {
    let remain = bodyLen >= 0 ? bodyLen : -1;

    return {
      length: bodyLen,
      read: async (): Promise<Buffer> => {
        if (remain === 0) return Buffer.from("");

        while (buf.length === 0) {
          const data = await TCPConnectionManager.ler(conn);
          if (data.length === 0) return Buffer.from("");
          BufferUtils.push(buf, data);
        }

        const consume = remain < 0 ? buf.length : Math.min(remain, buf.length);
        const data = Buffer.from(buf.data.subarray(0, consume));
        BufferUtils.pop(buf, consume);

        if (remain >= 0) remain -= consume;
        return data;
      },
    };
  }

  private deveFechar(msg: HTTPRequest): boolean {
    for (const h of msg.headers) {
      const s = h.toString("latin1");
      const idx = s.indexOf(":");
      if (idx > 0) {
        const key = s.substring(0, idx).trim().toLowerCase();
        if (key === "connection") {
          const val = s.substring(idx + 1).trim().toLowerCase();
          return val === "close";
        }
      }
    }
    return false;
  }

  private extrairContentLength(headers: Buffer[]): number {
    for (const h of headers) {
      const s = h.toString("latin1");
      const idx = s.indexOf(":");
      if (idx > 0) {
        const key = s.substring(0, idx).trim().toLowerCase();
        if (key === "content-length") {
          const val = parseInt(s.substring(idx + 1).trim(), 10);
          return isNaN(val) ? 0 : val;
        }
      }
    }
    return 0;
  }

  private temContentLength(headers: Buffer[]): boolean {
    return this.temHeader(headers, "Content-Length");
  }

  private temServer(headers: Buffer[]): boolean {
    return this.temHeader(headers, "Server");
  }

  private temHeader(headers: Buffer[], nome: string): boolean {
    const lower = nome.toLowerCase();
    for (const h of headers) {
      const s = h.toString("latin1");
      const idx = s.indexOf(":");
      if (idx > 0) {
        const key = s.substring(0, idx).trim().toLowerCase();
        if (key === lower) return true;
      }
    }
    return false;
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

  iniciar(): void {
    this.server.listen({ host: this.config.host, port: this.config.port }, () => {
      console.log(`Servidor ouvindo em ${this.config.host}:${this.config.port}`);
    });

    this.server.on("error", (err) => {
      console.error("Erro no servidor:", err);
      throw err;
    });
  }
}