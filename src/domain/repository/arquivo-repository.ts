import { Arquivo } from "../models/buisness/arquivo";

export interface IArquivoRepository {
  salvar(arquivo: Arquivo): Promise<void>;
  buscarPorNome(nome: string): Promise<Arquivo | null>;
  existe(nome: string): Promise<boolean>;
}