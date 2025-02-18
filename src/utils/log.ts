import * as log from "./logFormat"
export * from "./logFormat"

import path from 'path'

// export const { logR, logIdR, logDaR, logErR } = { logR, logIdR, logDaR, logErR }
export const timestamps = () =>
	`${log.IdR(Date.now().toString())} ${new Date().toISOString().split('T').map((e, i) => i === 0 ? log.DaR(e) : log.Raw(e, 36)).join(' ')} `
export const stamp = (msg: string) => console.log(timestamps() + msg)

export const PathR = () => {
	const stack = new Error().stack?.split("\n")[2]; // Get caller file line
	// console.log("Stack trace line:", stack); // Debugging

	// Match (path:line:column) OR path:line:column
	const match = stack?.match(/\(?([a-zA-Z]:\\.*?):\d+:\d+\)?/);

	// console.log("Regex match result:", match); // Debugging

	const callerPath = match ? match[1] : "Unknown";
	// console.log("Extracted caller path:", callerPath); // Debugging

	const workspaceRoot = process.cwd();
	// console.log("Workspace root:", workspaceRoot); // Debugging

	const relativePath = callerPath !== "Unknown" ? path.relative(workspaceRoot, callerPath) : "Unknown";
	// console.log("Final relative path:", relativePath); // Debugging

	return log.LiR(relativePath) + ': '

}