import { HTTPError } from "../../domain/use-cases/errors/http-error";
import { DynamicBuffer } from "../models/dynamic-buffer";
import { HTTPRequest } from "../models/http-request";
import { BufferUtils } from "./buffer-utils";

export class HTTPParser {
  private static readonly MAX_HEADER_LEN = 8 * 1024;

  static parseRequestLine(line: Buffer): [string, Buffer, string] {
    const s = line.toString("latin1").trim();
    const parts = s.split(" ");
    if (parts.length < 3) throw new HTTPError(400,  "Linha de requisição inválida");

    return [parts[0], Buffer.from(parts[1], "latin1"), parts[2].replace("HTTP/", "")];
  }

  static validarHeader(h: Buffer): boolean {
    return h && h.length > 0 && h.indexOf(":") > 0;
  }

  static cortarMensagem(buf: DynamicBuffer): null | HTTPRequest {
    const idx = buf.data.subarray(0, buf.length).indexOf("\r\n\r\n");
    if (idx < 0) {
      if (buf.length >= this.MAX_HEADER_LEN) {
        throw new HTTPError(413, "Header muito grande");
      }
      return null;
    }

    const headerBuf = Buffer.from(buf.data.subarray(0, idx + 4));
    const req = this.parseHTTPRequest(headerBuf);
    BufferUtils.pop(buf, idx + 4);
    return req;
  }

  private static parseHTTPRequest(data: Buffer): HTTPRequest {
    const lines = this.criarLinhas(data);
    const [method, uri, version] = this.parseRequestLine(lines[0]);
    const headers: Buffer[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.length === 0) break;
      if (!this.validarHeader(line)) {
        throw new HTTPError(400, "Header inválido");
      }
      headers.push(line);
    }

    return { method, uri, version, headers };
  }

  private static criarLinhas(data: Buffer): Buffer[] {
    return BufferUtils.splitLines(data);
  }
}