export type BodyReader = {
  length: number;
  read: () => Promise<Buffer>;
};