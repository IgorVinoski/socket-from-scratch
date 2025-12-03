import { Token, Usuario } from "../../models/buisness/usuario";
import { ITokenRepository } from "../../repository/token-repository";
import { HTTPError } from "../errors/http-error";

export class LoginUseCase {
  constructor(
    private usuarioValido: Usuario,
    private tokenRepository: ITokenRepository
  ) {}

  async execute(username: string, password: string): Promise<Token> {
    if (username !== this.usuarioValido.username || password !== this.usuarioValido.password) {
      throw new HTTPError(401, "Credenciais inválidas");
    }

    const novoToken = new Token(this.gerarChave());
    await this.tokenRepository.salvar(novoToken);
    return novoToken;
  }

  private gerarChave(): string {
    return "token_" + Math.random().toString(36).slice(2, 12) + "_" + Date.now();
  }
}