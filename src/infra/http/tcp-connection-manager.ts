import { TCPConnection } from "../models/tcp-connection";

export class TCPConnectionManager {
  static criar(socket: import("net").Socket): TCPConnection {
    const conn: TCPConnection = { socket, err: null, ended: false, reader: null };
    socket.pause();

    socket.on("data", (data: Buffer) => {
      if (conn.reader) {
        conn.socket.pause();
        conn.reader.resolve(data);
        conn.reader = null;
      }
    });

    socket.on("end", () => {
      conn.ended = true;
      if (conn.reader) {
        conn.reader.resolve(Buffer.from(""));
        conn.reader = null;
      }
    });

    socket.on("error", (err) => {
      conn.err = err;
      if (conn.reader) {
        conn.reader.reject(err);
        conn.reader = null;
      }
    });

    return conn;
  }

  static async ler(conn: TCPConnection): Promise<Buffer> {
    if (conn.err) return Promise.reject(conn.err);
    if (conn.ended) return Promise.resolve(Buffer.from(""));
    if (conn.reader) return Promise.reject(new Error("Leitura concorrente"));

    return new Promise((resolve, reject) => {
      conn.reader = { resolve, reject };
      conn.socket.resume();
    });
  }

  static async escrever(conn: TCPConnection, data: Buffer): Promise<void> {
    if (conn.err) return Promise.reject(conn.err);
    return new Promise((resolve, reject) => {
      conn.socket.write(data, (err?: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}