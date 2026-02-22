import { randomUUID } from "node:crypto";

export function nowIso(): string {
  return new Date().toISOString();
}

export function id(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

export function stringify(value: unknown): string {
  return JSON.stringify(value);
}
