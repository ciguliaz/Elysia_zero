/**
 * Formats a message with ANSI escape codes for terminal color output.
 * @param args - The first argument is the message, followed by ANSI color codes.
 * @returns A formatted string with ANSI color codes.
 */
export const Raw = (msg: string, ...colors: (number | string)[]): string => {
	if (!colors.length) return msg;
	const colorCode = colors.join(";");
	return `\x1b[${colorCode}m${msg}\x1b[0m`;
};

/**
* Logs a message to the console with ANSI colors.
* @param args - Arguments passed to `logR`, starting with a message and optional color codes.
*/
export const Custom = (...args: Parameters<typeof Raw>) => {
	console.log(Raw(...args));
};

/**
* Logs a **special** message in *Italic* and pink color.
* @param msg - The message to log.
* @returns A formatted string with special format
* .
*/
export const Ely = (msg: string): string => Raw(msg, 3, 31);

/**
* Logs an **ID** message in orange.
* @param msg - The message to log.
* @returns A formatted string with orange color.
*/
export const IdR = (msg: string): string => Raw(msg, 33);

/**
* Logs a **date** message in purple.
* @param msg - The message to log.
* @returns A formatted string with purple color.
*/
export const DaR = (msg: string): string => Raw(msg, 34);

/**
* Logs an **error** message in red.
* @param msg - The message to log.
* @returns A formatted string with red color.
*/
export const ErR = (msg: string): string => Raw(msg, 91);

/**
* Logs an **error** message in red.
* @param msg - The message to log.
* @returns A formatted string with red color.
*/
export const LiR = (msg: string): string => Raw(msg, 94);
