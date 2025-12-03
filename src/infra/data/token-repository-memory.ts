import { Token } from "../../domain/models/buisness/usuario";
import { ITokenRepository } from "../../domain/repository/token-repository";

export class TokenRepositoryMemory implements ITokenRepository {
  private storage = new Set<string>();

  async salvar(token: Token): Promise<void> {
    this.storage.add(token.valor);
  }

  async existe(token: string): Promise<boolean> {
    return this.storage.has(token);
  }
}
