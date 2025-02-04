import User from '../models/User';
import bcrypt from 'bcryptjs';

export const register = async (username: string, password: string) => {
	const hashedPassword = await bcrypt.hash(password, 10)
	const newUser = new User({ username, password: hashedPassword })
	return newUser.save()
}

export const login = async (username: string, password: string) => {
	const user = await User.findOne({ username })
	if (!user) return null;
	const isMatch = await bcrypt.compare(password, user.password)
	return isMatch ? user : null;
}

