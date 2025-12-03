import { BodyReader } from "./body-reader";

export type HTTPResponse = {
  code: number;
  headers: Buffer[];
  body: BodyReader;
};