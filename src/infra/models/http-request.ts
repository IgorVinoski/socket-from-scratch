export type HTTPRequest = {
  method: string;
  uri: Buffer;
  version: string;
  headers: Buffer[];
};