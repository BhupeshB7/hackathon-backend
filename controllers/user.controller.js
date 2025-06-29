import mongoose, { Types } from "mongoose";
import userSchema from "../validators/user.zod.js";
import Directory from "../models/directory.model.js";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import { verifyGoogleIdToken } from "../service/googleAuthService.js";
import { compareOTP, generateOTP, hashOTP } from "../service/generateOTP.js";
import OTP from "../models/otp.model.js";
import { EmailProvider } from "../service/EmailProvider.js";
export const registerUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  let transactionStarted = false;
  try {
    const parsed = userSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid input, please enter valid details",
        message: "Invalid input , please enter valid details",
      });
    }

    const user = parsed.data;
    const userEmail = user.email;
    const otpRecord = await OTP.findOne({ email: userEmail }).sort({
      createdAt: -1,
    });
    if (!otpRecord) {
      return res.status(400).json({
        error: "Email verification required",
        message: "Please verify your email address first before registering.",
      });
    }

    if (otpRecord.verified === false) {
      return res.status(400).json({
        error: "Email not verified",
        message: "Please complete email verification before registering.",
      });
    }
    await otpRecord.deleteOne();

    const rootDirId = new Types.ObjectId();
    const userId = new Types.ObjectId();

    session.startTransaction();
    transactionStarted = true;
    await Directory.insertOne(
      {
        _id: rootDirId,
        name: `root-${user.email}`,
        parentDirId: null,
        userId: userId,
      },
      { session }
    );
    await User.insertOne(
      {
        _id: userId,
        name: user.name,
        email: user.email,
        password: user.password,
        rootDirId,
      },
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    if (transactionStarted) {
      await session.abortTransaction();
    }
    if (error.code === 121) {
      return res.status(400).json({
        error: "Invalid input",
        message: "Invalid input , please enter valid details",
      });
    } else if (error.code === 11000) {
      if (error.keyValue.email) {
        return res.status(409).json({
          error: "This email already exists",
          message:
            "A user with this email address already exists. Please try logging in or use a different email.",
        });
      }
    } else {
      next(error);
    }
  } finally {
    session.endSession();
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const parsed = userSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid input, please enter valid details",
        message: "Invalid input , please enter valid details",
        success: false,
      });
    }
    const userData = parsed.data;
    const user = await User.findOne({ email: userData.email });
    if (!user) {
      return res.status(400).json({
        error: "Invalid email or password",
        message: "Invalid email or password",
        success: false,
      });
    }
    console.log("password", userData.password);
    const isPasswordMatch = await user.comparePassword(userData.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        error: "Invalid email or password",
        message: "Invalid email or password",
        success: false,
      });
    }
    const allSessions = await Session.find({ userId: user._id });
    if (allSessions.length > 2) {
      await allSessions[0].deleteOne();
    }
    const session = await Session.create({
      userId: user._id,
    });

      
    res.cookie("google_drive_session", session._id, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: true,
        signed: true,
        sameSite: 'none' 
      });
    res.status(200).json({
      message: "Login successful",
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const logOutUser = async (req, res, next) => {
  res.clearCookie("google_drive_session");
  res.status(200).json({
    message: "Logged out successfully",
  });
};

export const logoutAllDevices = async (req, res, next) => {
  const sessionId = req.signedCookies["google_drive_session"];
  try {
    if (!sessionId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Unauthorized",
      });
    }
    const currentSession = await Session.findById({ _id: sessionId }).lean();
    if (!currentSession) {
      return res.status(401).json({
        error: "Invalid session",
        message: "Session not found or already expired",
      });
    }
    const userId = currentSession.userId;
    await Session.deleteMany({ userId });
    res.clearCookie("google-drive-session");
    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getUserDetails = async (req, res, next) => {
  try {
    res.status(200).json({
      message: "User details fetched successfully",
      user: {
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const { idToken } = req.body;
    const decodedToken = await verifyGoogleIdToken(idToken);

    const user = await User.findOne({ email: decodedToken.email }).session(
      dbSession
    );

    if (!user) {
      const rootDirId = new Types.ObjectId();
      const userId = new Types.ObjectId();
      await Directory.insertOne(
        {
          _id: rootDirId,
          name: `root-${decodedToken.email}`,
          parentDirId: null,
          userId: userId,
        },
        { dbSession }
      );
      const userDetails = await User.findOneAndUpdate(
        { email: decodedToken.email },
        {
          $set: {
            _id: userId,
            name: decodedToken.name,
            picture: decodedToken.picture,
            verified: true,
            rootDirId,
          },
        },
        { upsert: true, new: true, session: dbSession }
      );
      const userSession = await Session.create({ userId: userDetails._id });
      console.log(userSession)
      res.cookie("google_drive_session", userSession.id, {
          maxAge: 1000 * 60 * 60 * 24 * 7,
          httpOnly: true,
          secure: true,
          signed: true,
          sameSite: 'none' 
      });

      await dbSession.commitTransaction();
      dbSession.endSession();

      return res.status(200).json({
        status: "success",
        message: "Google Login successful",
        data: userDetails,
      });
    } else {
      const allSessions = await Session.find({ userId: user._id }).lean();
      if (allSessions.length >= 3) {
        await Session.findByIdAndDelete(allSessions[0]._id);
      }

      const userSession = await Session.create({ userId: user._id });
      res.cookie("google_drive_session", userSession.id, {
          maxAge: 1000 * 60 * 60 * 24 * 7,
          httpOnly: true,
          secure: true,
          signed: true,
          sameSite: 'none' 
      });

      await dbSession.commitTransaction();
      dbSession.endSession();

      return res.status(200).json({
        status: "success",
        message: "Google Login successful",
      });
    }
  } catch (error) {
    await dbSession.abortTransaction();
    dbSession.endSession();
    next(error);
  }
};
// OTP verificaton
export const sendOTP = async (req, res, next) => {
  const { email } = req.body;

  try {
    const verifiedUser = await User.findOne({ email });
    if (verifiedUser) {
      return res.status(400).json({
        error: "Email already verified",
        message: "Email already verified",
      });
    }
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);

    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 10);

    await OTP.findOneAndUpdate(
      { email },
      {
        $set: {
          otp: hashedOTP,
          createdAt: new Date(),
          expiresAt: expiryTime,
          emailSent: false,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(200).json({
      message: "OTP generated successfully",
      expiresAt: expiryTime,
    });

    const emailProvider = new EmailProvider();

    emailProvider
      .sendEmail(email, otp)
      .then(() => {
        console.log(`Email successfully sent to ${email}`);
         
        OTP.findOneAndUpdate(
          { email, otp: hashedOTP },
          { $set: { emailSent: true } }
        ).catch((err) => console.error("Error updating OTP status:", err));
      })
      .catch((error) => {
        console.error(`Failed to send email to ${email}:`, error);
        setTimeout(() => {
          emailProvider
            .sendEmail(email, otp)
            .then(() => console.log(`Retry: Email sent to ${email}`))
            .catch((err) => console.error(`Retry failed for ${email}:`, err));
        }, 5000);
      });
  } catch (error) {
    console.error("Error processing OTP request:", error);
    res.status(500).json({
      error: "Failed to process OTP request",
      message: error.message,
    });
  }
};

export const verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(404).json({ error: "No OTP found for this email" });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    const compareotp = await compareOTP(otp, otpRecord.otp);
    if (!compareotp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }
    await OTP.findOneAndUpdate({ email }, { $set: { verified: true } });
    await User.findOneAndUpdate({ email }, { $set: { verified: true } });
    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
};
