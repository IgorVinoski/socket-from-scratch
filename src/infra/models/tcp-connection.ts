export type TCPConnection = {
  socket: import("net").Socket;
  err: null | Error;
  ended: boolean;
  reader: null | { resolve: (b: Buffer) => void; reject: (e: Error) => void };
};