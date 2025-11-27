import { TokenType, type Token } from "./types";
import { findUnit } from "./data/units";
import { findTimezone } from "./data/timezones";
import {
  findDayName,
  findMonthName,
  findSpecialDate,
  DATE_KEYWORDS,
} from "./data/dates";
import {
  isCurrency,
  getCurrencyFromSymbol,
  CURRENCY_SYMBOLS,
} from "./data/currencies";
import { parseTime } from "./utils/time";

export class Lexer {
  private pos = 0;
  private current: string | null;

  constructor(private input: string) {
    this.current = input[0] || null;
  }

  private advance() {
    this.pos++;
    this.current = this.pos < this.input.length ? this.input[this.pos]! : null;
  }

  private skipWhitespace() {
    while (this.current && /\s/.test(this.current)) {
      this.advance();
    }
  }

  private readNumber(): { value: number; isSpecial: boolean } {
    if (this.current === "0" && this.pos + 1 < this.input.length) {
      const next = this.input[this.pos + 1];

      if (next === "b" || next === "B") {
        this.advance(); // skip '0'
        this.advance(); // skip 'b'
        let binary = "";
        while (this.current && /[01]/.test(this.current)) {
          binary += this.current;
          this.advance();
        }
        if (binary.length === 0) {
          throw new Error("Invalid binary!");
        }
        return { value: parseInt(binary, 2), isSpecial: true };
      }

      if (next === "x" || next === "X") {
        this.advance(); // skip '0'
        this.advance(); // skip 'x'
        let hex = "";
        while (this.current && /[0-9a-f]/i.test(this.current)) {
          hex += this.current;
          this.advance();
        }
        if (hex.length === 0) {
          throw new Error("Invalid hexadecimal!");
        }
        return { value: parseInt(hex, 16), isSpecial: true };
      }

      if (next === "o" || next === "O") {
        this.advance(); // skip '0'
        this.advance(); // skip 'o'
        let octal = "";
        while (this.current && /[0-7]/.test(this.current)) {
          octal += this.current;
          this.advance();
        }
        if (octal.length === 0) {
          throw new Error("Invalid octal!");
        }
        return { value: parseInt(octal, 8), isSpecial: true };
      }
    }

    let num = "";
    let hasScientific = false;
    while (this.current && /[0-9.]/.test(this.current)) {
      num += this.current;
      this.advance();
    }

    const currentChar = this.current;
    if (currentChar === "e" || currentChar === "E") {
      hasScientific = true;
      num += currentChar;
      this.advance();

      const signChar = this.current;
      if (signChar === "+" || signChar === "-") {
        num += signChar;
        this.advance();
      }

      while (this.current && /[0-9]/.test(this.current)) {
        num += this.current;
        this.advance();
      }
    }

    return { value: parseFloat(num), isSpecial: hasScientific };
  }

  private readHexColor(): string | null {
    if (this.current !== "#") return null;

    let color = "#";
    this.advance();

    let hexDigits = "";
    while (
      this.current &&
      /[0-9a-f]/i.test(this.current) &&
      hexDigits.length < 6
    ) {
      hexDigits += this.current;
      this.advance();
    }

    if (hexDigits.length === 3 || hexDigits.length === 6) {
      return color + hexDigits;
    }

    return null;
  }

  private readWord(): string {
    let word = "";
    while (this.current && /[a-z°²]/i.test(this.current)) {
      word += this.current;
      this.advance();
    }
    return word.toLowerCase();
  }

  private readTimeOrLocation(): Token | null {
    const startPos = this.pos;

    let timeStr = "";
    while (this.current && /[0-9:apm]/i.test(this.current)) {
      timeStr += this.current;
      this.advance();
    }

    if (
      timeStr &&
      (timeStr.includes(":") || /am|pm/i.test(timeStr)) &&
      parseTime(timeStr)
    ) {
      return { type: TokenType.TIME, value: timeStr };
    }

    this.pos = startPos;
    this.current = this.input[startPos] ?? null;
    return null;
  }

  private peekWord(): string {
    let tempPos = this.pos;
    let word = "";
    while (
      tempPos < this.input.length &&
      /[a-z°²]/i.test(this.input[tempPos]!)
    ) {
      word += this.input[tempPos];
      tempPos++;
    }
    return word.toLowerCase();
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    const functions = [
      "sin",
      "cos",
      "tan",
      "log",
      "ln",
      "abs",
      "floor",
      "ceil",
      "round",
      "sqrt",
      "rgb",
      "hsl",
    ];
    const constants = ["pi", "e"];

    while (this.current !== null) {
      this.skipWhitespace();
      if (!this.current) break;

      if (this.current === "#") {
        const color = this.readHexColor();
        if (color) {
          tokens.push({ type: TokenType.COLOR, value: color });
          continue;
        }
      }

      const timeToken = this.readTimeOrLocation();
      if (timeToken) {
        tokens.push(timeToken);
        continue;
      }

      if (/[0-9]/.test(this.current)) {
        const numData = this.readNumber();
        tokens.push({
          type: TokenType.NUMBER,
          value: numData.value,
          isSpecial: numData.isSpecial,
        });
        continue;
      }

      if (this.current === "+") {
        tokens.push({ type: TokenType.PLUS, value: "+" });
        this.advance();
        continue;
      }
      if (this.current === "-") {
        tokens.push({ type: TokenType.MINUS, value: "-" });
        this.advance();
        continue;
      }
      if (this.current === "*") {
        tokens.push({ type: TokenType.MULTIPLY, value: "*" });
        this.advance();
        continue;
      }
      if (this.current === "/") {
        tokens.push({ type: TokenType.DIVIDE, value: "/" });
        this.advance();
        continue;
      }
      if (this.current === "%") {
        tokens.push({ type: TokenType.PERCENT, value: "%" });
        this.advance();
        continue;
      }
      if (this.current === "^") {
        tokens.push({ type: TokenType.CARET, value: "^" });
        this.advance();
        continue;
      }
      if (this.current === "(") {
        tokens.push({ type: TokenType.LPAREN, value: "(" });
        this.advance();
        continue;
      }
      if (this.current === ")") {
        tokens.push({ type: TokenType.RPAREN, value: ")" });
        this.advance();
        continue;
      }
      if (this.current === "!") {
        tokens.push({ type: TokenType.FACTORIAL, value: "!" });
        this.advance();
        continue;
      }
      if (this.current === ",") {
        tokens.push({ type: TokenType.COMMA, value: "," });
        this.advance();
        continue;
      }

      if (this.current && CURRENCY_SYMBOLS[this.current]) {
        const currency = getCurrencyFromSymbol(this.current)!;
        tokens.push({ type: TokenType.CURRENCY, value: currency });
        this.advance();
        continue;
      }

      if (/[a-z°²]/i.test(this.current)) {
        const word = this.readWord();

        if (this.current && /[0-9²]/.test(this.current)) {
          const digitPart = this.current;
          const compoundWord = word + digitPart;

          if (findUnit(compoundWord)) {
            this.advance();
            tokens.push({
              type: TokenType.UNIT,
              value: findUnit(compoundWord)!.name,
            });
            continue;
          }
        }

        if (this.current === "/") {
          const savedPos = this.pos;
          this.advance();
          if (this.current && /[a-z]/i.test(this.current)) {
            const secondPart = this.readWord();
            const compoundUnit = word + "/" + secondPart;
            if (findUnit(compoundUnit)) {
              tokens.push({
                type: TokenType.UNIT,
                value: findUnit(compoundUnit)!.name,
              });
              continue;
            } else {
              this.pos = savedPos;
              this.current = this.input[this.pos] ?? null;
            }
          } else {
            this.pos = savedPos;
            this.current = this.input[this.pos] ?? null;
          }
        }

        if (functions.includes(word)) {
          tokens.push({ type: TokenType.FUNCTION, value: word });
        } else if (constants.includes(word)) {
          tokens.push({ type: TokenType.CONSTANT, value: word });
        } else if (word === "deg") {
          tokens.push({ type: TokenType.DEG, value: "deg" });
        } else if (word === "rad") {
          tokens.push({ type: TokenType.RAD, value: "rad" });
        } else if (word === "power") {
          tokens.push({ type: TokenType.POWER, value: "power" });
        } else if (word === "mod") {
          tokens.push({ type: TokenType.MOD, value: "mod" });
        } else if (word === "of") {
          tokens.push({ type: TokenType.OF, value: "of" });
        } else if (word === "in" || word === "to") {
          tokens.push({
            type: word === "in" ? TokenType.IN : TokenType.TO,
            value: word,
          });
        } else if (word === "square") {
          this.skipWhitespace();
          const nextWord = this.peekWord();
          if (nextWord === "root") {
            this.readWord();
            tokens.push({ type: TokenType.FUNCTION, value: "sqrt" });
          } else if (
            nextWord === "meter" ||
            nextWord === "meters" ||
            nextWord === "foot" ||
            nextWord === "feet" ||
            nextWord === "mile" ||
            nextWord === "kilometer"
          ) {
            const unitWord = "square " + this.readWord();
            const unit = findUnit(unitWord);
            if (unit) {
              tokens.push({ type: TokenType.UNIT, value: unit.name });
            } else {
              throw new Error(`Unknown unit: ${unitWord}`);
            }
          } else {
            throw new Error(`Unknown keyword: square ${nextWord}`);
          }
        } else if (findUnit(word)) {
          tokens.push({ type: TokenType.UNIT, value: findUnit(word)!.name });
        } else if (word === "time" || word === "current") {
          tokens.push({ type: TokenType.TIME_KEYWORD, value: word });
        } else if (findTimezone(word)) {
          tokens.push({ type: TokenType.LOCATION, value: word });
        } else if (findDayName(word) !== undefined) {
          tokens.push({ type: TokenType.DAY_NAME, value: word });
        } else if (findMonthName(word) !== undefined) {
          tokens.push({ type: TokenType.MONTH_NAME, value: word });
        } else if (findSpecialDate(word)) {
          tokens.push({ type: TokenType.SPECIAL_DATE, value: word });
        } else if (DATE_KEYWORDS.includes(word)) {
          tokens.push({ type: TokenType.DATE_KEYWORD, value: word });
        } else if (isCurrency(word)) {
          tokens.push({ type: TokenType.CURRENCY, value: word.toUpperCase() });
        } else if (word === "new") {
          this.skipWhitespace();
          const nextWord = this.peekWord();
          if (nextWord === "year" || nextWord === "years") {
            const yearWord = this.readWord();
            this.skipWhitespace();

            const quoteChar = this.current;
            if (quoteChar === `'`) {
              this.advance();
              const sChar = this.current;
              if (sChar === `s`) {
                this.advance();
                this.skipWhitespace();
                const eveWord = this.peekWord();
                if (eveWord === "eve") {
                  this.readWord();
                  tokens.push({
                    type: TokenType.SPECIAL_DATE,
                    value: "new year's eve",
                  });
                  continue;
                }
              }
            } else if (this.peekWord() === "eve") {
              this.readWord();
              tokens.push({
                type: TokenType.SPECIAL_DATE,
                value: "new years eve",
              });
              continue;
            }

            tokens.push({
              type: TokenType.SPECIAL_DATE,
              value: `new ${yearWord}`,
            });
          } else {
            throw new Error(`Unknown keyword: ${word}`);
          }
        } else {
          throw new Error(`Unknown keyword: ${word}`);
        }
        continue;
      }

      throw new Error(`Unknown character: ${this.current}`);
    }

    tokens.push({ type: TokenType.EOF, value: "EOF" });
    return tokens;
  }
}
