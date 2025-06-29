const config = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI:
      process.env.MONGODB_URI || "mongodb+srv://bhupeshkr2912:TzPTM4Bz0QusY00O@cluster0.dbe8y5j.mongodb.net/",
  ORIGIN: "http://localhost:5173",
  COOKIE_SECRET: "secret",
  jwtSecret: "secret",
  jwtExpiration: 60 * 60 * 24 * 7,
  google_ClientId:process.env.GOOGLE_CLIENT_ID||"834134541338-1gm9f90k64m3ns0daujb25v765a8hekd.apps.googleusercontent.com"
};

export default config;
