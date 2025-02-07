import User from '../models/User'
import bcrypt from 'bcryptjs'
import { logR, logEly, logDaR, logIdR, logLiR, logErR } from '../utils/logFormat';
import { timestamps, logWithTime } from '../utils/log';

//TODO: handle duplicate username register
export const register = async (username: string, password: string) => {
	const hashedPassword = await bcrypt.hash(password, 10)
	const newUser = new User({ username, password: hashedPassword })
	console.log(`New user registered: ${username} // ${password} // ${hashedPassword}`)
	return newUser.save()
}

export const login = async (username: string, password: string) => {
	const user = await User.findOne({ username })
	if (!user) return null
	const isMatch = await bcrypt.compare(password, user.password)
	isMatch
		? logWithTime(`New user logged in: ${logR('"', 32) + username + logR('"', 32) + logR('||', 32) + logR('"', 32) + password + logR('"', 32)}`)
		: logWithTime(`New user logged, ${logErR('Wrong Credentials')}: ${logR('"', 32) + username + logR('"', 32) + logR('||', 32) + logR('"', 32) + password + logR('"', 32)}`)
	return isMatch ? user : null
}

