let baseURL = '';
if (process.env.SITE_VERSION !== process.env.CURRENT_VERSION) {
    baseURL = `/${process.env.SITE_VERSION}`;
}

const initPaymentUrl = "https://sadad.shaparak.ir/api/v0/PaymentByIdentity/PaymentRequest";
const verifyPaymentUrl = "https://sadad.shaparak.ir/VPG/api/v0/Advice/Verify";

module.exports = { baseURL, initPaymentUrl, verifyPaymentUrl };