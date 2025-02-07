import * as log from "./logFormat"
export * from "./logFormat"

import path from 'path'

// export const { logR, logIdR, logDaR, logErR } = { logR, logIdR, logDaR, logErR }
export const timestamps = () =>
	`${log.IdR(Date.now().toString())} ${log.DaR(new Date().toISOString().replace('T', ' '))}: `
export const WithTime = (msg: string) => console.log(timestamps() + msg)

export const getRelativePath = () => {
	const path1 = process.cwd()
	const path2 = import.meta.url.replace("file:///", "");
	return path.relative(path1, path2)
}