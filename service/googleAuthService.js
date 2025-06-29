import { OAuth2Client } from "google-auth-library";
const clientId =
    "834134541338-1gm9f90k64m3ns0daujb25v765a8hekd.apps.googleusercontent.com";
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
