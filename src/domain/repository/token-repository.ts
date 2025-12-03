import { Token } from "../models/buisness/usuario";

export interface ITokenRepository {
  salvar(token: Token): Promise<void>;
  existe(token: string): Promise<boolean>;
}