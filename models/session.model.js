import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    deviceName: { type: String },
    deviceType: { type: String },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 7,
    },
});

const Session = mongoose.model("Session", sessionSchema);

export default Session;
