import { DateTime } from "luxon";
import type {
	ASTNode,
	ASTEvalResult,
	ColorValue,
	CurrencyEvalResult,
	UnitDef,
} from "../types";
import { ValueWithUnit, formatNumber } from "../types";
import { findUnit } from "../data/units";
import { findTimezone } from "../data/timezones";
import { findDayName } from "../data/dates";
import { isCrypto, CURRENCY_SYMBOLS } from "../data/currencies";
import { getCachedRate } from "../cache/currency";
import { parseTime } from "../utils/time";
import { createColorValue, hslToRgb } from "../utils/color";

export class NumberNode implements ASTNode {
	constructor(
		private value: number,
		private wasSpecialFormat: boolean = false,
	) {}

	evaluate(): number {
		return this.value;
	}

	isSpecialFormat(): boolean {
		return this.wasSpecialFormat;
	}
}

export class ConstantNode implements ASTNode {
	constructor(private name: string) {}

	evaluate(): number {
		switch (this.name) {
			case "pi":
				return Math.PI;
			case "e":
				return Math.E;
			default:
				throw new Error(`Unknown constant: ${this.name}`);
		}
	}
}

export class PercentageNode implements ASTNode {
	constructor(private value: number) {}

	evaluate(): number {
		return this.value / 100;
	}

	getValue(): number {
		return this.value;
	}
}

export class BinaryOpNode implements ASTNode {
	constructor(
		private left: ASTNode,
		private op: string,
		private right: ASTNode,
	) {}

	evaluate(): number | ValueWithUnit {
		const leftVal = this.left.evaluate();

		if (
			(this.op === "+" || this.op === "-") &&
			this.right instanceof PercentageNode
		) {
			if (leftVal instanceof ValueWithUnit) {
				const percentVal = (this.right as PercentageNode).getValue();
				const change = leftVal.value * (percentVal / 100);
				const newValue =
					this.op === "+" ? leftVal.value + change : leftVal.value - change;
				return new ValueWithUnit(newValue, leftVal.unit);
			} else if (typeof leftVal === "number") {
				const percentVal = (this.right as PercentageNode).getValue();
				const change = leftVal * (percentVal / 100);
				return this.op === "+" ? leftVal + change : leftVal - change;
			}
		}

		const rightVal = this.right.evaluate();

		if (leftVal instanceof ValueWithUnit || rightVal instanceof ValueWithUnit) {
			if (
				leftVal instanceof ValueWithUnit &&
				rightVal instanceof ValueWithUnit
			) {
				if (this.op === "+" || this.op === "-") {
					if (leftVal.unit.type !== rightVal.unit.type) {
						throw new Error(
							`Cannot ${this.op === "+" ? "add" : "subtract"} ${
								leftVal.unit.name
							} and ${rightVal.unit.name}`,
						);
					}
					const rightInBase = rightVal.unit.toBase(rightVal.value);
					const rightInLeftUnit = leftVal.unit.fromBase(rightInBase);
					const result =
						this.op === "+"
							? leftVal.value + rightInLeftUnit
							: leftVal.value - rightInLeftUnit;
					return new ValueWithUnit(result, leftVal.unit);
				}
				throw new Error(`Cannot perform ${this.op} on two values with units`);
			} else if (
				leftVal instanceof ValueWithUnit &&
				typeof rightVal === "number"
			) {
				if (this.op === "*" || this.op === "of") {
					return new ValueWithUnit(leftVal.value * rightVal, leftVal.unit);
				} else if (this.op === "/") {
					return new ValueWithUnit(leftVal.value / rightVal, leftVal.unit);
				}
				throw new Error(`Cannot perform ${this.op} on unit value and scalar`);
			} else if (
				typeof leftVal === "number" &&
				rightVal instanceof ValueWithUnit
			) {
				if (this.op === "*" || this.op === "of") {
					return new ValueWithUnit(leftVal * rightVal.value, rightVal.unit);
				}
				throw new Error(`Cannot perform ${this.op} on scalar and unit value`);
			}
		}

		if (typeof leftVal === "number" && typeof rightVal === "number") {
			switch (this.op) {
				case "+":
					return leftVal + rightVal;
				case "-":
					return leftVal - rightVal;
				case "*":
					return leftVal * rightVal;
				case "/":
					if (rightVal === 0) throw new Error("Division by zero");
					return leftVal / rightVal;
				case "power":
				case "^":
					return leftVal ** rightVal;
				case "of":
					return leftVal * rightVal;
				case "mod":
					return leftVal % rightVal;
				default:
					throw new Error(`Unknown operator: ${this.op}`);
			}
		}

		throw new Error("Invalid operation");
	}
}

export class UnaryOpNode implements ASTNode {
	constructor(
		private op: string,
		private operand: ASTNode,
	) {}

	evaluate(): number | ValueWithUnit {
		const val = this.operand.evaluate();

		if (val instanceof ValueWithUnit) {
			if (this.op === "-") {
				return new ValueWithUnit(-val.value, val.unit);
			} else if (this.op === "+") {
				return val;
			}
		} else if (typeof val === "number") {
			if (this.op === "-") return -val;
			if (this.op === "+") return val;
		}

		throw new Error(`Unknown unary operator: ${this.op}`);
	}
}

export class FunctionNode implements ASTNode {
	constructor(
		private name: string,
		private arg: ASTNode,
	) {}

	evaluate(): number {
		const argVal = this.arg.evaluate();

		if (argVal instanceof ValueWithUnit) {
			throw new Error(`Cannot apply function ${this.name} to value with unit`);
		}

		if (typeof argVal !== "number") {
			throw new Error("Function argument must be a number");
		}

		switch (this.name) {
			case "sin":
				return Math.sin(argVal);
			case "cos":
				return Math.cos(argVal);
			case "tan":
				return Math.tan(argVal);
			case "log":
				return Math.log10(argVal);
			case "ln":
				return Math.log(argVal);
			case "abs":
				return Math.abs(argVal);
			case "floor":
				return Math.floor(argVal);
			case "ceil":
				return Math.ceil(argVal);
			case "round":
				return Math.round(argVal);
			case "sqrt":
				return Math.sqrt(argVal);
			default:
				throw new Error(`Unknown function: ${this.name}`);
		}
	}
}

export class FactorialNode implements ASTNode {
	constructor(private operand: ASTNode) {}

	evaluate(): number {
		const val = this.operand.evaluate();
		if (typeof val !== "number") {
			throw new Error("Factorial requires a number");
		}

		if (val < 0 || !Number.isInteger(val)) {
			throw new Error("Factorial requires a non-negative integer");
		}

		let result = 1;
		for (let i = 2; i <= val; i++) {
			result *= i;
		}
		return result;
	}
}

export class AngleNode implements ASTNode {
	constructor(
		private value: ASTNode,
		private mode: "deg" | "rad",
	) {}

	evaluate(): number {
		const val = this.value.evaluate();
		if (typeof val !== "number") {
			throw new Error("Angle value must be a number");
		}

		if (this.mode === "deg") {
			return val * (Math.PI / 180);
		}
		return val;
	}
}

export class ValueWithUnitNode implements ASTNode {
	constructor(
		private value: ASTNode,
		private unit: UnitDef,
	) {}

	evaluate(): ValueWithUnit {
		const val = this.value.evaluate();
		if (typeof val === "number") {
			return new ValueWithUnit(val, this.unit);
		}
		throw new Error("Cannot attach unit to value that already has a unit");
	}

	getUnit(): UnitDef {
		return this.unit;
	}
}

export class ConversionNode implements ASTNode {
	constructor(
		private value: ASTNode,
		private targetUnit: UnitDef,
	) {}

	evaluate(): ValueWithUnit {
		const val = this.value.evaluate();

		if (val instanceof ValueWithUnit) {
			if (val.unit.type !== this.targetUnit.type) {
				throw new Error(
					`Cannot convert ${val.unit.name} to ${this.targetUnit.name} - incompatible unit types`,
				);
			}

			const inBase = val.unit.toBase(val.value);
			const inTarget = this.targetUnit.fromBase(inBase);

			return new ValueWithUnit(inTarget, this.targetUnit, true);
		} else if (typeof val === "number") {
			throw new Error("Cannot convert unitless value");
		}

		throw new Error("Invalid conversion");
	}
}

export class TimeConversionNode implements ASTNode {
	constructor(
		private time: string,
		private fromLocation: string,
		private toLocation: string,
	) {}

	evaluate(): string {
		const parsedTime = parseTime(this.time);
		if (!parsedTime) throw new Error(`Invalid time format: ${this.time}`);

		const fromTz = findTimezone(this.fromLocation);
		const toTz = findTimezone(this.toLocation);

		if (!fromTz) throw new Error(`Unknown location: ${this.fromLocation}`);
		if (!toTz) throw new Error(`Unknown location: ${this.toLocation}`);

		const sourceTime = DateTime.now().setZone(fromTz).set({
			hour: parsedTime.hour,
			minute: parsedTime.minute,
			second: 0,
			millisecond: 0,
		});

		const targetTime = sourceTime.setZone(toTz);

		const sourceDayOfYear = sourceTime.ordinal;
		const targetDayOfYear = targetTime.ordinal;

		if (sourceDayOfYear !== targetDayOfYear) {
			return targetTime.toFormat("d. MMMM yyyy 'at' HH:mm");
		}

		return targetTime.toFormat("HH:mm");
	}
}

export class CurrentTimeNode implements ASTNode {
	constructor(private location: string) {}

	evaluate(): string {
		const tz = findTimezone(this.location);
		if (!tz) throw new Error(`Unknown location: ${this.location}`);

		const now = DateTime.now().setZone(tz);
		return now.toFormat("HH:mm");
	}
}

export class RelativeTimeNode implements ASTNode {
	constructor(
		private amount: number,
		private unit: string,
		private direction: "forward" | "backward",
	) {}

	evaluate(): string {
		const multiplier = this.direction === "backward" ? -1 : 1;
		const time = DateTime.now().plus({
			[this.unit]: this.amount * multiplier,
		});

		return time.toFormat("HH:mm");
	}
}

export class RelativeDateNode implements ASTNode {
	constructor(
		private dayName: string,
		private weeksForward: number,
	) {}

	evaluate(): string {
		const targetDayOfWeek = findDayName(this.dayName)!;
		let date = DateTime.now();

		const currentDayOfWeek = date.weekday;
		const daysToAdd = targetDayOfWeek - currentDayOfWeek;
		date = date.plus({ days: daysToAdd });

		date = date.plus({ weeks: this.weeksForward });

		return date.toFormat("d. MMMM yyyy");
	}
}

export class NextLastDayNode implements ASTNode {
	constructor(
		private direction: "next" | "last",
		private dayName: string,
	) {}

	evaluate(): string {
		const targetDayOfWeek = findDayName(this.dayName)!;
		let date = DateTime.now();

		if (this.direction === "next") {
			date = date.plus({ days: 1 });
			while (date.weekday !== targetDayOfWeek) {
				date = date.plus({ days: 1 });
			}
		} else {
			date = date.minus({ days: 1 });
			while (date.weekday !== targetDayOfWeek) {
				date = date.minus({ days: 1 });
			}
		}

		return date.toFormat("d. MMMM yyyy");
	}
}

export class DurationOffsetNode implements ASTNode {
	constructor(
		private amount: number,
		private unit: string,
		private direction: "forward" | "backward",
	) {}

	evaluate(): string {
		const multiplier = this.direction === "backward" ? -1 : 1;
		const date = DateTime.now().plus({
			[this.unit]: this.amount * multiplier,
		});

		return date.toFormat("d. MMMM yyyy");
	}
}

export class DaysUntilNode implements ASTNode {
	constructor(
		private targetDate: DateTime,
		private unit: "days" | "weeks" | "months" | "years",
	) {}

	evaluate(): string {
		const now = DateTime.now().startOf("day");
		const target = this.targetDate.startOf("day");
		const diff = target.diff(now, this.unit);

		const amount = Math.round(diff[this.unit]);
		return `${Math.abs(amount)} ${this.unit}`;
	}
}

export class DaysBetweenNode implements ASTNode {
	constructor(
		private date1: DateTime,
		private date2: DateTime,
		private unit: "days" | "weeks" | "months" | "years",
	) {}

	evaluate(): string {
		const start = this.date1.startOf("day");
		const end = this.date2.startOf("day");
		const diff = end.diff(start, this.unit);

		const amount = Math.round(Math.abs(diff[this.unit]));
		return `${amount} ${this.unit}`;
	}
}

export class ColorNode implements ASTNode {
	constructor(
		private r: number,
		private g: number,
		private b: number,
		private format?: "rgb" | "hex" | "hsl",
	) {}

	evaluate(): ColorValue | string {
		const color = createColorValue(this.r, this.g, this.b);

		if (!this.format) {
			return color;
		}

		if (this.format === "hex") {
			return color.hex;
		} else if (this.format === "hsl") {
			return color.hsl;
		} else {
			return color.rgb;
		}
	}
}

export class CurrencyConversionNode implements ASTNode {
	constructor(
		private amount: number,
		private fromCurrency: string,
		private toCurrency: string,
	) {}

	evaluate(): CurrencyEvalResult {
		const from = this.fromCurrency.toUpperCase();
		const to = this.toCurrency.toUpperCase();

		const fromIsCrypto = isCrypto(from);
		const toIsCrypto = isCrypto(to);

		let rate: number;
		let graph: Record<string, number> | undefined;
		let lastUpdated: DateTime | undefined;

		if (from === to) {
			rate = 1;
		} else if (fromIsCrypto && to === "USD") {
			const rateData = getCachedRate(from, "USD");
			if (!rateData) {
				throw new Error(
					`Currency rates not available for ${from}. Please update rates first.`,
				);
			}
			rate = rateData.value;
			graph = rateData.graph;
			lastUpdated = rateData.lastUpdated;
		} else if (from === "USD" && toIsCrypto) {
			const rateData = getCachedRate(to, "USD");
			if (!rateData) {
				throw new Error(
					`Currency rates not available for ${to}. Please update rates first.`,
				);
			}
			rate = 1 / rateData.value;
			lastUpdated = rateData.lastUpdated;

			if (rateData.graph) {
				graph = {};
				for (const date in rateData.graph) {
					graph[date] = 1 / rateData.graph[date];
				}
			}
		} else if (fromIsCrypto && toIsCrypto) {
			const fromToUsdData = getCachedRate(from, "USD");
			const toToUsdData = getCachedRate(to, "USD");

			if (!fromToUsdData || !toToUsdData) {
				throw new Error(
					`Currency rates not available. Please update rates first.`,
				);
			}

			rate = fromToUsdData.value / toToUsdData.value;
			lastUpdated = fromToUsdData.lastUpdated;

			if (fromToUsdData.graph && toToUsdData.graph) {
				graph = {};
				for (const date in fromToUsdData.graph) {
					if (toToUsdData.graph[date]) {
						graph[date] = fromToUsdData.graph[date]! / toToUsdData.graph[date]!;
					}
				}
			}
		} else if (fromIsCrypto && !toIsCrypto) {
			const cryptoToUsdData = getCachedRate(from, "USD");
			const usdToFiatData = getCachedRate("USD", to);

			if (!cryptoToUsdData || !usdToFiatData) {
				throw new Error(
					`Currency rates not available. Please update rates first.`,
				);
			}

			rate = cryptoToUsdData.value * usdToFiatData.value;
			lastUpdated = cryptoToUsdData.lastUpdated;

			if (cryptoToUsdData.graph && usdToFiatData.graph) {
				graph = {};
				for (const date in cryptoToUsdData.graph) {
					if (usdToFiatData.graph[date]) {
						graph[date] =
							cryptoToUsdData.graph[date]! * usdToFiatData.graph[date]!;
					}
				}
			}
		} else if (!fromIsCrypto && toIsCrypto) {
			const usdToFromData = getCachedRate("USD", from);
			const toToUsdData = getCachedRate(to, "USD");

			if (!usdToFromData || !toToUsdData) {
				throw new Error(
					`Currency rates not available. Please update rates first.`,
				);
			}

			rate = 1 / usdToFromData.value / toToUsdData.value;
			lastUpdated = toToUsdData.lastUpdated;

			if (usdToFromData.graph && toToUsdData.graph) {
				graph = {};
				for (const date in usdToFromData.graph) {
					if (toToUsdData.graph[date]) {
						graph[date] =
							1 / usdToFromData.graph[date]! / toToUsdData.graph[date]!;
					}
				}
			}
		} else if (from === "USD") {
			const rateData = getCachedRate("USD", to);
			if (!rateData) {
				throw new Error(
					`Currency rates not available for ${to}. Please update rates first.`,
				);
			}
			rate = rateData.value;
			graph = rateData.graph;
			lastUpdated = rateData.lastUpdated;
		} else if (to === "USD") {
			const rateData = getCachedRate("USD", from);
			if (!rateData) {
				throw new Error(
					`Currency rates not available for ${from}. Please update rates first.`,
				);
			}
			rate = 1 / rateData.value;
			lastUpdated = rateData.lastUpdated;

			if (rateData.graph) {
				graph = {};
				for (const date in rateData.graph) {
					graph[date] = 1 / rateData.graph[date];
				}
			}
		} else {
			const usdToFromData = getCachedRate("USD", from);
			const usdToToData = getCachedRate("USD", to);

			if (!usdToFromData || !usdToToData) {
				throw new Error(
					`Currency rates not available. Please update rates first.`,
				);
			}

			rate = (1 / usdToFromData.value) * usdToToData.value;
			lastUpdated = usdToFromData.lastUpdated;

			if (usdToFromData.graph && usdToToData.graph) {
				graph = {};
				for (const date in usdToFromData.graph) {
					if (usdToToData.graph[date]) {
						graph[date] =
							(1 / usdToFromData.graph[date]!) * usdToToData.graph[date]!;
					}
				}
			}
		}

		const result = this.amount * rate;

		const symbol =
			Object.entries(CURRENCY_SYMBOLS).find(([_, code]) => code === to)?.[0] ||
			to;
		const formatted = `${symbol}${formatNumber(result, 100000)}`;

		return {
			value: formatted,
			graph,
			lastUpdated,
		};
	}
}
