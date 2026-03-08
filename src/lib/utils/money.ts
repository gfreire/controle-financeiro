// Converte reais para centavos
export function toCents(value: number): number {
  return Math.round(value * 100);
}

// Converte centavos para reais
export function fromCents(cents: number): number {
  return cents / 100;
}

// Soma valores monetários com segurança
export function add(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b));
}

// Subtrai valores monetários
export function subtract(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b));
}

// Multiplica valor por quantidade (parcelas, etc)
export function multiply(value: number, factor: number): number {
  return fromCents(toCents(value) * factor);
}

// Divide valor em partes iguais
export function divide(value: number, divisor: number): number {
  return fromCents(Math.round(toCents(value) / divisor));
}

// Arredonda para 2 casas
export function round(value: number): number {
  return Math.round(value * 100) / 100;
}