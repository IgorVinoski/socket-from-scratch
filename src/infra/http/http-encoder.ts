import { HTTPResponse } from "../models/http-response";

export class HTTPEncoder {
  static encode(resp: HTTPResponse): Buffer {
    const reason = this.obterMotivo(resp.code);
    const statusLine = `HTTP/1.1 ${resp.code} ${reason}\r\n`;
    const headers = resp.headers.map((b) => b.toString("latin1")).join("\r\n");
    const full = statusLine + (headers ? headers + "\r\n" : "") + "\r\n";
    return Buffer.from(full, "latin1");
  }

  private static obterMotivo(code: number): string {
    const motivos: { [key: number]: string } = {
      200: "OK",
      201: "Created",
      400: "Bad Request",
      401: "Unauthorized",
      404: "Not Found",
      500: "Internal Server Error",
    };
    return motivos[code] || "Status";
  }
}
