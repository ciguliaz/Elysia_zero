import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    joinedServers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Server' }]
}, { timestamps: true });

export default mongoose.model('User', UserSchema);