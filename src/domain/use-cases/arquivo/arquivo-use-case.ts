import { Arquivo } from "../../models/buisness/arquivo";
import { IArquivoRepository } from "../../repository/arquivo-repository";
import { ITokenRepository } from "../../repository/token-repository";
import { HTTPError } from "../errors/http-error";

export class ArquivoUseCase {
  constructor(
    private arquivoRepository: IArquivoRepository,
    private tokenRepository: ITokenRepository
  ) {}

  async salvarArquivo(arquivo: Arquivo, token: string): Promise<void> {
    if (!(await this.tokenRepository.existe(token))) {
      throw new HTTPError(401, "Token inválido");
    }
    await this.arquivoRepository.salvar(arquivo);
  }

  async obterArquivo(nome: string): Promise<Arquivo> {
    const arquivo = await this.arquivoRepository.buscarPorNome(nome);
    if (!arquivo) {
      throw new HTTPError(404, "Arquivo não encontrado");
    }
    return arquivo;
  }
}
