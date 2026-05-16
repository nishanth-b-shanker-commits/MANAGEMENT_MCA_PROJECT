const { TOTP } = require('totp-generator');
try {
    const { otp, expires } = TOTP.generate('JBSWY3DPEHPK3PXP');
    console.log('OTP:', otp);
} catch (e) {
    console.error('Error:', e.message);
}
try {
    const { otp, expires } = TOTP.generate('8B9A23E45F6178C9');
    console.log('OTP with hex:', otp);
} catch (e) {
    console.error('Hex Error:', e.message);
}
