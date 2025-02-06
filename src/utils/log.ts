import { logR, logIdR, logDaR, logErR } from "./logFormat"

export const timestamps = () => `${logIdR(Date.now().toString())} ${logDaR(new Date().toISOString())}: `
export const logWithTime = (msg: string) => console.log(timestamps() + msg)