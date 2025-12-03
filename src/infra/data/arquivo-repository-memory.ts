import { Arquivo } from "../../domain/models/buisness/arquivo";
import { IArquivoRepository } from "../../domain/repository/arquivo-repository";

export class ArquivoRepositoryMemory implements IArquivoRepository {
  private storage = new Map<string, Arquivo>();

  async salvar(arquivo: Arquivo): Promise<void> {
    this.storage.set(arquivo.nome, arquivo);
  }

  async buscarPorNome(nome: string): Promise<Arquivo  | null> {
    return this.storage.get(nome) || null;
  }

  async existe(nome: string): Promise<boolean> {
    return this.storage.has(nome);
  }
}