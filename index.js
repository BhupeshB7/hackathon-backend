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

// Middlewares before all routes
app.use(express.json());

// ✅ Log origin for debug (optional)
app.use((req, res, next) => {
    console.log("Origin:", req.headers.origin);
    next();
});

// ✅ CORS config
const allowedOrigins = [
    "http://localhost:5173",
    "https://hackathon-google-drive.netlify.app",
    "https://hackathon-fronted-zeta.vercel.app",
    "https://codingott-google-drive.netlify.app",
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Content-Length",
        "X-Requested-With",
        "dirname",
        "filename",
    ],
}));

// ✅ Important: Handle preflight requests
app.options("*", cors());

// ✅ Security middleware
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                frameAncestors: allowedOrigins,
            },
        },
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

app.use(xssClean());
app.use(mongoSanitize());
app.use(cookieParser(config.COOKIE_SECRET));

// ✅ Routes
app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/api", allRoutes);

// ✅ Global Error Handler
app.use((err, req, res, next) => {
    console.error("Error:", err.stack);
    res.status(500).send("Internal Server Error");
});

app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
