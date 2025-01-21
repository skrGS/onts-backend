import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import mongoose from "mongoose";
import fileUpload from "express-fileupload";
import "express-async-errors";
import { createClientRouter } from "./router";
import errorHandler from "./middlewares/error";
import path from "path";
import { initDatabase } from "./dbInitializer";

const app = express();

const port = 3011;

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3012",
  "https://test.missk.mn",
  "https://onts.boosters.mn",
  "https://www.onts.boosters.mn",
  "https://missk.mn",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.log(`Blocked origin: ${origin}`); // Log blocked origin
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
    },
    credentials: true,
  })
);

app.use(fileUpload());
app.use(compression());
app.use(bodyParser.json());
app.use(cookieParser());

app.use(express.static(path.join(process.cwd(), "public")));

const MONGO_URI = "mongodb+srv://noskr:0401@mydb.5msnhth.mongodb.net/onts";

mongoose.Promise = Promise;
mongoose.connect(MONGO_URI, {
  tlsAllowInvalidCertificates: true,
});
mongoose.connection.on("error", (error) => {
  console.log("MongoDB connection error: " + error);
  process.exit(-1);
});

mongoose.connection.once("open", async () => {
  console.log("Connected to MongoDB");

  await initDatabase();
});

app.use("/", createClientRouter());
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Client server is running on http://localhost:${port}`);
});
