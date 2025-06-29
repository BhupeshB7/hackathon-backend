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
        frameAncestors: [
          "'self'",
          "http://localhost:5173",
          "https://hackathon-google-drive.netlify.app",
          "https://hackathon-fronted-zeta.vercel.app/",
          "https://codingott-google-drive.netlify.app",
        ],
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
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:5173",
        "https://hackathon-google-drive.netlify.app",
        "https://hackathon-fronted-zeta.vercel.app/",
        "https://codingott-google-drive.netlify.app",
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
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
