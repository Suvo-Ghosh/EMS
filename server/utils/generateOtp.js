import crypto from "crypto";

// Generate a 6-digit OTP
export const generateOtp = () => {
    const otp = crypto.randomInt(100000, 999999); 
    return otp.toString(); // return OTP as string
};
