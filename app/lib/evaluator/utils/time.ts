import { DateTime } from "luxon";
import type { ParsedTime } from "../types";

export function parseTime(timeStr: string): ParsedTime | null {
	timeStr = timeStr.toLowerCase().trim();

	const twelveHourMatch = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
	if (twelveHourMatch) {
		let hour = parseInt(twelveHourMatch[1]!);
		const minute = twelveHourMatch[2] ? parseInt(twelveHourMatch[2]) : 0;
		const period = twelveHourMatch[3]!;

		if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;

		if (period === "pm" && hour !== 12) hour += 12;
		if (period === "am" && hour === 12) hour = 0;

		return { hour, minute };
	}

	const twentyFourHourMatch = timeStr.match(/^(\d{1,2}):?(\d{2})$/);
	if (twentyFourHourMatch) {
		const hour = parseInt(twentyFourHourMatch[1]!);
		const minute = parseInt(twentyFourHourMatch[2]!);

		if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

		return { hour, minute };
	}

	return null;
}

export function parseDateFromTokens(
	month: number,
	day: number,
	year?: number,
): DateTime {
	const now = DateTime.now();
	const targetYear = year || now.year;

	const date = DateTime.local(targetYear, month, day);
	if (!year && date < now) {
		return DateTime.local(targetYear + 1, month, day);
	}

	return date;
}
