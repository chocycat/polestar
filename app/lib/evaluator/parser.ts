import { DateTime } from "luxon";
import { TokenType, type Token, type ASTNode, ValueWithUnit } from "./types";
import { findUnit } from "./data/units";
import { findMonthName, findSpecialDate } from "./data/dates";
import { isCurrency } from "./data/currencies";
import { hexToRgb, hslToRgb } from "./utils/color";
import { parseDateFromTokens } from "./utils/time";
import {
  NumberNode,
  ConstantNode,
  PercentageNode,
  BinaryOpNode,
  UnaryOpNode,
  FunctionNode,
  FactorialNode,
  AngleNode,
  ValueWithUnitNode,
  ConversionNode,
  TimeConversionNode,
  CurrentTimeNode,
  RelativeTimeNode,
  RelativeDateNode,
  NextLastDayNode,
  DurationOffsetNode,
  DaysUntilNode,
  ColorNode,
  CurrencyConversionNode,
} from "./ast/nodes";

export class Parser {
  private pos = 0;
  private current: Token;

  constructor(private tokens: Token[]) {
    this.current = tokens[0]!;
  }

  private advance() {
    this.pos++;
    this.current = this.tokens[this.pos]!;
  }

  private expect(type: TokenType): Token {
    if (this.current.type !== type) {
      throw new Error(
        `Expected ${TokenType[type]}, got ${TokenType[this.current.type]} (${
          this.current.value
        })`
      );
    }
    const token = this.current;
    this.advance();
    return token;
  }

  parse(): ASTNode {
    const colorExpr = this.parseColorExpression();
    if (colorExpr) {
      if (this.current.type !== TokenType.EOF) {
        throw new Error(
          `Unexpected token after expression: ${TokenType[this.current.type]}`
        );
      }
      return colorExpr;
    }

    const currencyExpr = this.parseCurrencyExpression();
    if (currencyExpr) {
      if (this.current.type !== TokenType.EOF) {
        throw new Error(
          `Unexpected token after expression: ${TokenType[this.current.type]}`
        );
      }
      return currencyExpr;
    }

    const timeExpr = this.parseTimeExpression();
    if (timeExpr) {
      if (this.current.type !== TokenType.EOF) {
        throw new Error(
          `Unexpected token after expression: ${TokenType[this.current.type]}`
        );
      }
      return timeExpr;
    }

    const dateExpr = this.parseDateExpression();
    if (dateExpr) {
      if (this.current.type !== TokenType.EOF) {
        throw new Error(
          `Unexpected token after expression: ${TokenType[this.current.type]}`
        );
      }
      return dateExpr;
    }

    const result = this.parseConversion();
    if (this.current.type !== TokenType.EOF) {
      throw new Error(
        `Unexpected token after expression: ${TokenType[this.current.type]}`
      );
    }
    return result;
  }

  private parseConversion(): ASTNode {
    let node = this.parseAddition();

    let fromCurrency: string | undefined;
    const findCurrency = (n: any): string | undefined => {
      if (!n) return undefined;
      if (n.__currency) return n.__currency;
      if (n.left) {
        const leftCurrency = findCurrency(n.left);
        if (leftCurrency) return leftCurrency;
      }
      if (n.right) {
        const rightCurrency = findCurrency(n.right);
        if (rightCurrency) return rightCurrency;
      }
      if (n.value) return findCurrency(n.value);
      if (n.operand) return findCurrency(n.operand);
      if (n.arg) return findCurrency(n.arg);
      return undefined;
    };
    fromCurrency = findCurrency(node);

    if (
      this.current.type === TokenType.IN ||
      this.current.type === TokenType.TO
    ) {
      this.advance();

      if (this.current.type === TokenType.CURRENCY && fromCurrency) {
        const toCurrency = this.current.value as string;
        this.advance();

        const result = node.evaluate();
        if (typeof result === "number") {
          return new CurrencyConversionNode(result, fromCurrency, toCurrency);
        }
      } else if (this.current.type === TokenType.UNIT) {
        const targetUnitToken = this.current;
        const targetUnit = findUnit(targetUnitToken.value as string);
        if (!targetUnit) {
          throw new Error(`Unknown target unit: ${targetUnitToken.value}`);
        }
        this.advance();
        node = new ConversionNode(node, targetUnit);
      } else if (fromCurrency) {
        throw new Error("Invalid conversion target: no currency");
      } else if (node instanceof ValueWithUnit || (node as any).unit) {
        throw new Error("Invalid conversion target: no unit");
      }
    }

    return node;
  }

  private parsePostfix(): ASTNode {
    let node = this.parseAtomWithUnit();

    while (this.current.type === TokenType.FACTORIAL) {
      this.advance();
      node = new FactorialNode(node);
    }

    return node;
  }

  private parseAddition(): ASTNode {
    let node = this.parseMultiplication();

    while (
      this.current.type === TokenType.PLUS ||
      this.current.type === TokenType.MINUS
    ) {
      const op = this.current.value as string;
      this.advance();
      node = new BinaryOpNode(node, op, this.parseMultiplication());
    }

    return node;
  }

  private parseMultiplication(): ASTNode {
    let node = this.parsePower();

    while (
      this.current.type === TokenType.MULTIPLY ||
      this.current.type === TokenType.DIVIDE ||
      this.current.type === TokenType.OF ||
      this.current.type === TokenType.MOD ||
      this.current.type === TokenType.NUMBER ||
      this.current.type === TokenType.CONSTANT ||
      this.current.type === TokenType.LPAREN ||
      this.current.type === TokenType.FUNCTION
    ) {
      let op: string;

      if (
        this.current.type === TokenType.NUMBER ||
        this.current.type === TokenType.CONSTANT ||
        this.current.type === TokenType.LPAREN ||
        this.current.type === TokenType.FUNCTION
      ) {
        op = "*";
      } else {
        op =
          this.current.type === TokenType.OF
            ? "of"
            : this.current.type === TokenType.MOD
            ? "mod"
            : (this.current.value as string);
        this.advance();
      }

      node = new BinaryOpNode(node, op, this.parsePower());
    }

    return node;
  }

  private parseColorExpression(): ASTNode | null {
    if (this.current.type === TokenType.COLOR) {
      const hexColor = this.current.value as string;
      this.advance();

      const rgb = hexToRgb(hexColor);

      if (
        this.current.type === TokenType.TO ||
        this.current.type === TokenType.IN
      ) {
        this.advance();

        if (this.current.type === TokenType.FUNCTION) {
          const format = this.current.value as string;
          this.advance();

          if (format === "rgb" || format === "hsl" || format === "hex") {
            return new ColorNode(rgb.r, rgb.g, rgb.b, format as any);
          }
        }
      }

      return new ColorNode(rgb.r, rgb.g, rgb.b);
    }

    return null;
  }

  private parsePower(): ASTNode {
    let node = this.parseUnary();

    while (
      this.current.type === TokenType.POWER ||
      this.current.type === TokenType.CARET
    ) {
      const op = this.current.type === TokenType.POWER ? "power" : "^";
      this.advance();
      node = new BinaryOpNode(node, op, this.parsePostfix());
    }

    return node;
  }

  private parseUnary(): ASTNode {
    if (
      this.current.type === TokenType.MINUS ||
      this.current.type === TokenType.PLUS
    ) {
      const op = this.current.value as string;
      this.advance();
      return new UnaryOpNode(op, this.parseUnary());
    }

    if (this.current.type === TokenType.FUNCTION) {
      const funcName = this.current.value as string;
      this.advance();

      if (funcName === "rgb" || funcName === "hsl") {
        this.expect(TokenType.LPAREN);
        const arg1 = this.expect(TokenType.NUMBER).value as number;
        this.expect(TokenType.COMMA);
        const arg2 = this.expect(TokenType.NUMBER).value as number;
        this.expect(TokenType.COMMA);
        const arg3 = this.expect(TokenType.NUMBER).value as number;
        this.expect(TokenType.RPAREN);

        if (funcName === "hsl") {
          const rgb = hslToRgb(arg1, arg2, arg3);
          return new ColorNode(rgb.r, rgb.g, rgb.b, "rgb");
        } else {
          return new ColorNode(arg1, arg2, arg3, "rgb");
        }
      }

      const isTrigFunc = ["sin", "cos", "tan"].includes(funcName);

      if (this.current.type === TokenType.OF) {
        this.advance();
        let arg = this.parsePostfix();

        if (isTrigFunc && this.current.type === TokenType.DEG) {
          this.advance();
          arg = new AngleNode(arg, "deg");
        }

        return new FunctionNode(funcName, arg);
      } else if (this.current.type === TokenType.LPAREN) {
        this.advance();
        let arg = this.parseAddition();

        if (isTrigFunc && this.current.type === TokenType.DEG) {
          this.advance();
          arg = new AngleNode(arg, "deg");
        } else if (isTrigFunc && this.current.type === TokenType.RAD) {
          this.advance();
          arg = new AngleNode(arg, "rad");
        }

        this.expect(TokenType.RPAREN);
        return new FunctionNode(funcName, arg);
      } else {
        let arg = this.parsePostfix();

        if (isTrigFunc && this.current.type === TokenType.DEG) {
          this.advance();
          arg = new AngleNode(arg, "deg");
        }

        return new FunctionNode(funcName, arg);
      }
    }

    return this.parsePostfix();
  }

  private parseAtomWithUnit(): ASTNode {
    if (this.current.type === TokenType.CURRENCY) {
      const currency = this.current.value as string;
      this.advance();
      const amount = this.expect(TokenType.NUMBER).value as number;

      const node = new NumberNode(amount);
      (node as any).__currency = currency;
      return node;
    }

    let node = this.parseAtom();

    if (this.current.type === TokenType.CURRENCY) {
      const currency = this.current.value as string;
      this.advance();

      (node as any).__currency = currency;
      return node;
    }

    if (this.current.type === TokenType.UNIT) {
      const unitToken = this.current;
      const unit = findUnit(unitToken.value as string);
      if (!unit) {
        throw new Error(`Unknown unit: ${unitToken.value}`);
      }
      this.advance();
      node = new ValueWithUnitNode(node, unit);
    }

    return node;
  }

  private parseAtom(): ASTNode {
    if (this.current.type === TokenType.LPAREN) {
      this.advance();
      const node = this.parseAddition();
      this.expect(TokenType.RPAREN);
      return node;
    }

    if (this.current.type === TokenType.CONSTANT) {
      const name = this.current.value as string;
      this.advance();
      return new ConstantNode(name);
    }

    if (this.current.type === TokenType.NUMBER) {
      const value = this.current.value as number;
      const isSpecial = this.current.isSpecial || false;
      this.advance();

      if (this.current.type === TokenType.PERCENT) {
        this.advance();
        return new PercentageNode(value);
      }

      return new NumberNode(value, isSpecial);
    }

    throw new Error(
      `Unexpected token: ${TokenType[this.current.type]} (${
        this.current.value
      })`
    );
  }

  private parseTimeExpression(): ASTNode | null {
    if (
      this.current.type === TokenType.TIME_KEYWORD &&
      this.current.value === "time"
    ) {
      this.advance();
      this.expect(TokenType.IN);
      const location = this.expect(TokenType.LOCATION).value as string;
      return new CurrentTimeNode(location);
    }

    if (this.current.type === TokenType.TIME) {
      const timeValue = this.current.value as string;
      this.advance();

      if (this.current.type === TokenType.LOCATION) {
        const fromLocation = this.current.value as string;
        this.advance();

        if (
          this.current.type === TokenType.IN ||
          this.current.type === TokenType.TO
        ) {
          this.advance();
          const toLocation = this.expect(TokenType.LOCATION).value as string;
          return new TimeConversionNode(timeValue, fromLocation, toLocation);
        }
      }
    }

    return null;
  }

  private parseDateExpression(): ASTNode | null {
    if (this.current.type === TokenType.NUMBER) {
      const savedPos = this.pos;
      const amount = this.current.value as number;
      this.advance();

      if (
        this.current.type === TokenType.UNIT ||
        this.current.type === TokenType.DATE_KEYWORD
      ) {
        const unit = this.current.value as string;

        if (
          ["hour", "hours", "minute", "minutes", "second", "seconds"].includes(
            unit
          )
        ) {
          this.advance();

          if (
            this.current.type === TokenType.DATE_KEYWORD &&
            this.current.value === "ago"
          ) {
            this.advance();
            const normalized = unit.endsWith("s") ? unit : unit + "s";
            return new RelativeTimeNode(amount, normalized, "backward");
          }

          if (
            this.current.type === TokenType.DATE_KEYWORD &&
            this.current.value === "from"
          ) {
            this.advance();
            if (
              this.current.type === TokenType.DATE_KEYWORD &&
              this.current.value === "now"
            ) {
              this.advance();
              const normalized = unit.endsWith("s") ? unit : unit + "s";
              return new RelativeTimeNode(amount, normalized, "forward");
            }
          }
        }
      }

      this.pos = savedPos;
      this.current = this.tokens[this.pos]!;
    }

    if (this.current.type === TokenType.IN) {
      const savedPos = this.pos;
      this.advance();

      if (this.current.type === TokenType.NUMBER) {
        const amount = this.current.value as number;
        this.advance();

        if (
          this.current.type === TokenType.UNIT ||
          this.current.type === TokenType.DATE_KEYWORD
        ) {
          const unit = this.current.value as string;

          if (
            [
              "hour",
              "hours",
              "minute",
              "minutes",
              "second",
              "seconds",
            ].includes(unit)
          ) {
            this.advance();
            const normalized = unit.endsWith("s") ? unit : unit + "s";
            return new RelativeTimeNode(amount, normalized, "forward");
          }
        }
      }

      this.pos = savedPos;
      this.current = this.tokens[this.pos]!;
    }

    if (this.current.type === TokenType.DAY_NAME) {
      const dayName = this.current.value as string;
      this.advance();

      if (this.current.type === TokenType.IN) {
        this.advance();
        const amount = this.expect(TokenType.NUMBER).value as number;

        if (
          this.current.type === TokenType.UNIT ||
          this.current.type === TokenType.DATE_KEYWORD
        ) {
          const unit = this.current.value as string;

          if (unit === "week" || unit === "weeks") {
            this.advance();
            return new RelativeDateNode(dayName, amount);
          }
        }
      }
    }

    if (
      this.current.type === TokenType.DATE_KEYWORD &&
      (this.current.value === "next" || this.current.value === "last")
    ) {
      const direction = this.current.value as "next" | "last";
      this.advance();
      const dayName = this.expect(TokenType.DAY_NAME).value as string;
      return new NextLastDayNode(direction, dayName);
    }

    if (this.current.type === TokenType.NUMBER) {
      const amount = this.current.value as number;
      const savedPos = this.pos;
      this.advance();

      if (
        this.current.type === TokenType.UNIT ||
        this.current.type === TokenType.DATE_KEYWORD
      ) {
        const unit = this.current.value as string;
        this.advance();

        if (
          this.current.type === TokenType.DATE_KEYWORD &&
          this.current.value === "ago"
        ) {
          this.advance();
          const normalizedUnit = unit.endsWith("s") ? unit : unit + "s";
          return new DurationOffsetNode(amount, normalizedUnit, "backward");
        } else if (
          this.current.type === TokenType.DATE_KEYWORD &&
          this.current.value === "from"
        ) {
          this.advance();
          if (
            this.current.type === TokenType.DATE_KEYWORD &&
            this.current.value === "now"
          ) {
            this.advance();
            const normalizedUnit = unit.endsWith("s") ? unit : unit + "s";
            return new DurationOffsetNode(amount, normalizedUnit, "forward");
          }
        }
      }

      this.pos = savedPos;
      this.current = this.tokens[this.pos]!;
    }

    if (this.current.type === TokenType.IN) {
      this.advance();
      const amount = this.expect(TokenType.NUMBER).value as number;

      if (
        this.current.type === TokenType.UNIT ||
        this.current.type === TokenType.DATE_KEYWORD
      ) {
        const unit = this.current.value as string;
        this.advance();
        const normalizedUnit = unit.endsWith("s") ? unit : unit + "s";
        return new DurationOffsetNode(amount, normalizedUnit, "forward");
      }
    }

    if (
      this.current.type === TokenType.UNIT ||
      this.current.type === TokenType.DATE_KEYWORD
    ) {
      const unit = this.current.value as string;
      const savedPos = this.pos;
      this.advance();

      if (
        this.current.type === TokenType.DATE_KEYWORD &&
        this.current.value === "until"
      ) {
        this.advance();
        const targetDate = this.parseDate();
        if (targetDate) {
          const normalizedUnit = unit.endsWith("s") ? unit : unit + "s";
          return new DaysUntilNode(targetDate, normalizedUnit as any);
        }
      }

      this.pos = savedPos;
      this.current = this.tokens[this.pos]!;
    }

    return null;
  }

  private parseDate(): DateTime | null {
    if (this.current.type === TokenType.SPECIAL_DATE) {
      const specialDate = findSpecialDate(this.current.value as string)!;
      this.advance();
      return parseDateFromTokens(specialDate.month, specialDate.day);
    }

    if (this.current.type === TokenType.NUMBER) {
      const day = this.current.value as number;
      this.advance();

      if (this.current.type === TokenType.MONTH_NAME) {
        const month = findMonthName(this.current.value as string)!;
        this.advance();

        let year: number | undefined;
        if (this.current.type === TokenType.NUMBER) {
          year = this.current.value as number;
          this.advance();
        }

        return parseDateFromTokens(month, day, year);
      }
    }

    if (this.current.type === TokenType.MONTH_NAME) {
      const month = findMonthName(this.current.value as string)!;
      this.advance();

      if (this.current.type === TokenType.NUMBER) {
        const day = this.current.value as number;
        this.advance();

        let year: number | undefined;
        if (this.current.type === TokenType.NUMBER) {
          year = this.current.value as number;
          this.advance();
        }

        return parseDateFromTokens(month, day, year);
      }
    }

    return null;
  }

  private parseCurrencyExpression(): ASTNode | null {
    let amount: number | undefined;
    let fromCurrency: string | undefined;

    if (this.current.type === TokenType.CURRENCY) {
      fromCurrency = this.current.value as string;
      this.advance();

      if (this.current.type === TokenType.NUMBER) {
        amount = this.current.value as number;
        this.advance();
      } else {
        this.pos--;
        this.current = this.tokens[this.pos]!;
        return null;
      }
    } else if (this.current.type === TokenType.NUMBER) {
      const savedPos = this.pos;
      amount = this.current.value as number;
      this.advance();

      if (this.current.type === TokenType.CURRENCY) {
        fromCurrency = this.current.value as string;
        this.advance();
      } else {
        this.pos = savedPos;
        this.current = this.tokens[this.pos]!;
        return null;
      }
    } else {
      return null;
    }

    if (
      this.current.type === TokenType.IN ||
      this.current.type === TokenType.TO
    ) {
      const savedPos = this.pos;
      this.advance();

      if (this.current.type === TokenType.CURRENCY) {
        const toCurrency = this.current.value as string;
        this.advance();
        return new CurrencyConversionNode(amount!, fromCurrency!, toCurrency);
      } else {
        this.pos = savedPos;
        this.current = this.tokens[this.pos]!;
        return null;
      }
    }

    return null;
  }
}
