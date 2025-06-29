import { OAuth2Client } from "google-auth-library";
import config from "../config/constant.js";
const clientId = config.google_ClientId;
const client = new OAuth2Client({
    clientId,
});

export async function verifyGoogleIdToken(idToken) {
    const loginTicket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const userData = loginTicket.getPayload();
    return userData;
}
