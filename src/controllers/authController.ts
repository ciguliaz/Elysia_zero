import bcrypt from 'bcryptjs';
import User from '../models/User';
import * as log from '../utils/log';
import { ErR, Raw } from '../utils/logFormat';

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
		? log.stamp(`New user logged in: ${Raw('"', 32) + username + Raw('"', 32) + Raw('||', 32) + Raw('"', 32) + password + Raw('"', 32)}`)
		: log.stamp(`New user logged, ${ErR('Wrong Credentials')}: ${Raw('"', 32) + username + Raw('"', 32) + Raw('||', 32) + Raw('"', 32) + password + Raw('"', 32)}`)
	return isMatch ? user : null
}

