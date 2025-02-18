import mongoose from "mongoose";

const ServerSchema = new mongoose.Schema({
	name: { type: String, required: true },
	description: { type: String }, // Optional, but useful
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
	channels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }]
}, { timestamps: true });

// Ensure owner is always in members
ServerSchema.pre('save', function (next) {
	if (!this.members.includes(this.owner)) {
		this.members.push(this.owner);
	}
	next();
});

export default mongoose.model('Server', ServerSchema);
