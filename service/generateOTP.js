import crypto from "crypto";
import bcrypt from "bcrypt";
export const generateOTP = () => {
  const otp = crypto.randomInt(100000, 1000000);
  return otp.toString();
};
export const hashOTP = (otp) => {
  return bcrypt.hashSync(otp, 10);
};

export const compareOTP = (otp, hashedOTP) => {
  return bcrypt.compareSync(otp, hashedOTP);
};
