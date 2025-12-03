export class Usuario {
  constructor(
    public readonly username: string,
    public readonly password: string
  ) {}
}

export class Token {
  public readonly valor: string;
  public readonly criadoEm: Date;

  constructor(valor: string) {
    this.valor = valor;
    this.criadoEm = new Date();
  }

  ehValido(): boolean {
     if(this.valor && this.valor.length > 0){
      return true
     }
     return false
  }
}