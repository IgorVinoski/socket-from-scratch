export class Arquivo {
  constructor(
    public readonly nome: string,
    public readonly conteudo: string,
    public readonly tipo: "text/html" | "text/plain"
  ) {
    this.validar();
  }

  private validar(): void {
    if (!this.nome || this.nome.trim().length === 0) {
      throw new Error("Nome do arquivo é obrigatório");
    }
    if (!this.conteudo) {
      throw new Error("Conteúdo é obrigatório");
    }
    if (this.tipo !== "text/html" && this.tipo !== "text/plain") {
      throw new Error("Tipo deve ser text/html ou text/plain");
    }
  }
}