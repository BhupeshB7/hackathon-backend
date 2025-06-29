import express from "express";
import cors from "cors";
import helmet from "helmet";
import xssClean from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import config from "./config/constant.js";
import connectDB from "./config/db.js";
import allRoutes from "./routes/index.js";

const port = config.PORT;
await connectDB();

const app = express();

app.use(express.json());
// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
            frameAncestors: ["'self'", "http://localhost:5173"],
      },
    },
    // crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(xssClean());
app.use(mongoSanitize());

// Core Middlewares
app.use(cookieParser(config.COOKIE_SECRET));
app.use(
  cors({
    origin:  "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "X-Requested-With",
      "dirname",
      "filename",
    ],
  })
);

// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/api", allRoutes);

//  Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
  next();
});

app.listen(port, () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
