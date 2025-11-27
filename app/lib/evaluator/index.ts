export * from "./types";
export { Lexer } from "./lexer";
export { Parser } from "./parser";
export { updateCurrencyRates } from "./cache/currency";

export { findUnit, UNITS } from "./data/units";
export { findTimezone, TIMEZONE_MAP } from "./data/timezones";
export {
  isCurrency,
  isCrypto,
  FIAT_CURRENCIES,
  CRYPTO_CURRENCIES,
} from "./data/currencies";
export {
  findDayName,
  findMonthName,
  findSpecialDate,
  DATE_KEYWORDS,
} from "./data/dates";

export { parseTime, parseDateFromTokens } from "./utils/time";
export {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  createColorValue,
  generateColorName,
} from "./utils/color";

import type { EvaluationResult, ASTNode, ColorValue } from "./types";
import { ValueWithUnit, formatNumber, ResultType } from "./types";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { findUnit } from "./data/units";
import {
  NumberNode,
  CurrencyConversionNode,
  TimeConversionNode,
  CurrentTimeNode,
  RelativeTimeNode,
  NextLastDayNode,
  DurationOffsetNode,
  DaysUntilNode,
  RelativeDateNode,
  ColorNode,
  ConversionNode,
} from "./ast/nodes";

function getResultType(ast: ASTNode): ResultType {
  if (ast instanceof CurrencyConversionNode) return ResultType.Currency;
  if (
    ast instanceof TimeConversionNode ||
    ast instanceof CurrentTimeNode ||
    ast instanceof RelativeTimeNode
  )
    return ResultType.Time;
  if (
    ast instanceof NextLastDayNode ||
    ast instanceof DurationOffsetNode ||
    ast instanceof DaysUntilNode ||
    ast instanceof RelativeDateNode
  )
    return ResultType.Date;
  if (ast instanceof ColorNode) return ResultType.Color;
  if (ast instanceof ConversionNode) return ResultType.Conversion;

  return ResultType.Math;
}

export interface CalculateOptions {
  discardUseless?: boolean;
}

export function calculate(
  input: string,
  options?: CalculateOptions
): EvaluationResult | null {
  try {
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    if (options?.discardUseless && ast instanceof NumberNode) {
      if (!(ast as any).isSpecialFormat?.()) {
        return null;
      }
    }

    const resultType = getResultType(ast);
    const result = ast.evaluate();

    switch (resultType) {
      case ResultType.Color: {
        if (typeof result === "object" && result !== null && "hex" in result) {
          return {
            type: ResultType.Color,
            color: result as ColorValue,
          };
        }
        return {
          type: ResultType.Color,
          color: { r: 0, g: 0, b: 0, hex: "", rgb: "", hsl: "", name: "" },
          formatted: result as string,
        };
      }

      case ResultType.Currency: {
        if (
          typeof result === "object" &&
          result !== null &&
          "value" in result
        ) {
          const currencyResult = result as {
            value: string;
            graph?: Record<string, number>;
            lastUpdated?: any;
          };
          return {
            type: ResultType.Currency,
            value: currencyResult.value,
            graph: currencyResult.graph,
            lastUpdated: currencyResult.lastUpdated,
          };
        }
        break;
      }

      case ResultType.Conversion: {
        if (result instanceof ValueWithUnit) {
          if (!result.explicitConversion && result.unit.defaultTarget) {
            const targetUnit = findUnit(result.unit.defaultTarget);
            if (targetUnit) {
              const inBase = result.unit.toBase(result.value);
              const converted = targetUnit.fromBase(inBase);
              const convertedResult = new ValueWithUnit(converted, targetUnit);
              return {
                type: ResultType.Conversion,
                value: convertedResult.toString(),
                from: result.toString(),
                unit: result.unit,
              };
            }
          }
          return {
            type: ResultType.Conversion,
            value: result.toString(),
            unit: result.unit,
          };
        }
        break;
      }

      case ResultType.Time:
      case ResultType.Date: {
        return {
          type: resultType,
          value: result as string,
        };
      }

      case ResultType.Math:
      default: {
        if (result instanceof ValueWithUnit) {
          if (!result.explicitConversion && result.unit.defaultTarget) {
            const targetUnit = findUnit(result.unit.defaultTarget);
            if (targetUnit) {
              const inBase = result.unit.toBase(result.value);
              const converted = targetUnit.fromBase(inBase);
              const convertedResult = new ValueWithUnit(converted, targetUnit);
              return {
                type: ResultType.Conversion,
                value: convertedResult.toString(),
                from: result.toString(),
                unit: result.unit,
              };
            }
          }
          return {
            type: ResultType.Conversion,
            value: result.toString(),
            unit: result.unit,
          };
        }

        if (typeof result === "number") {
          return {
            type: ResultType.Math,
            value: formatNumber(result),
            numericValue: result,
          };
        }

        return {
          type: ResultType.Math,
          value: String(result),
        };
      }
    }

    return {
      type: ResultType.Math,
      value: String(result),
    };
  } catch (e) {
    throw new Error(`Calculation error: ${(e as Error).message}`);
  }
}
