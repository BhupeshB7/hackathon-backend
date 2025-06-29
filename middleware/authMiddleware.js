import Session from "../models/session.model.js";
import User from "../models/user.model.js";

export const authMiddleware = async (req, res, next) => {
  const sessionId = req.signedCookies["google_drive_session"];
  if (!sessionId) {
    res.clearCookie("google_drive_session");
    return res.status(401).json({
      error: "Unauthorized",
      message: "Unauthorized",
    });
  }
  try {
    const currentSession = await Session.findById({ _id: sessionId }).lean();
    if (!currentSession) {
      return res.status(401).json({
        error: "Invalid session",
        message: "Session not found or already expired",
      });
    }
    const userId = currentSession.userId;
    const user = await User.findById({ _id: userId });
    if (!user) {
      return res.status(401).json({
        error: "Invalid session",
        message: "Session not found or already expired",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
