import type { DateTime } from "luxon";

export enum UnitType {
  LENGTH,
  MASS,
  VOLUME,
  TEMPERATURE,
  AREA,
  SPEED,
  TIME,
  DATA,
  ENERGY,
  PRESSURE,
}

export interface UnitDef {
  name: string;
  type: UnitType;
  aliases: string[];
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
  symbol?: string;
  defaultTarget?: string;
}

export interface ColorValue {
  r: number;
  g: number;
  b: number;
  hex: string;
  rgb: string;
  hsl: string;
  name: string;
}

export enum ResultType {
  Math = "math",
  Conversion = "conversion",
  Currency = "currency",
  Time = "time",
  Date = "date",
  Color = "color",
}

export interface MathResult {
  type: ResultType.Math;
  value: string;
  numericValue?: number;
}

export interface ConversionResult {
  type: ResultType.Conversion;
  value: string;
  from?: string;
  unit: UnitDef;
}

export interface CurrencyResult {
  type: ResultType.Currency;
  value: string;
  from?: string;
  graph?: Record<string, number>;
  lastUpdated?: DateTime;
}

export interface TimeResult {
  type: ResultType.Time;
  value: string;
}

export interface DateResult {
  type: ResultType.Date;
  value: string;
}

export interface ColorResult {
  type: ResultType.Color;
  color: ColorValue;
  formatted?: string;
}

export type EvaluationResult =
  | MathResult
  | ConversionResult
  | CurrencyResult
  | TimeResult
  | DateResult
  | ColorResult;

export type CalculationResult = EvaluationResult;

export enum TokenType {
  NUMBER,
  PLUS,
  MINUS,
  MULTIPLY,
  DIVIDE,
  PERCENT,
  POWER,
  CARET,
  MOD,
  LPAREN,
  RPAREN,
  FUNCTION,
  CONSTANT,
  OF,
  UNIT,
  IN,
  TO,
  TIME,
  LOCATION,
  TIME_KEYWORD,
  DAY_NAME,
  MONTH_NAME,
  SPECIAL_DATE,
  DATE_KEYWORD,
  CURRENCY,
  FACTORIAL,
  DEG,
  RAD,
  COLOR,
  COMMA,
  HASH,
  EOF,
}

export interface Token {
  type: TokenType;
  value: string | number;
  isSpecial?: boolean;
}

export interface ParsedTime {
  hour: number;
  minute: number;
}

export interface CurrencyRate {
  value: number;
  lastUpdated: DateTime;
  graph?: Record<string, number>;
}

export interface ASTNode {
  evaluate(): ASTEvalResult;
}

export type ASTEvalResult =
  | number
  | string
  | ValueWithUnit
  | ColorValue
  | CurrencyEvalResult;

export interface CurrencyEvalResult {
  value: string;
  graph?: Record<string, number>;
  lastUpdated?: DateTime;
}

export class ValueWithUnit {
  constructor(
    public value: number,
    public unit: UnitDef,
    public explicitConversion: boolean = false
  ) {}

  toString(): string {
    const symbol = this.unit.symbol || this.unit.aliases[0];
    return `${formatNumber(this.value, 10000)} ${symbol}`;
  }
}

export function formatNumber(n: number, precision = 100000000): string {
  if (Math.abs(n) >= 1e9 || (Math.abs(n) < 1e-4 && n !== 0)) {
    return n.toExponential(2);
  }

  const rounded = Math.round(n * precision) / precision;
  return rounded.toString();
}
