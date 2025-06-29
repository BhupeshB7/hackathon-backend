const config = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI:
      process.env.MONGODB_URI || "mongodb+srv://bhupeshkr2912:TzPTM4Bz0QusY00O@cluster0.dbe8y5j.mongodb.net/",
  ORIGIN: "http://localhost:5173",
  COOKIE_SECRET: "secret",
  jwtSecret: "secret",
  jwtExpiration: 60 * 60 * 24 * 7,
};

export default config;
