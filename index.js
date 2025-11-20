import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.config.js";
import foodRouter from "./routes/foodRouter.js";
import verifyRouter from "./routes/verifyRoute.js";
import cookieParser from "cookie-parser";

const app = express();
const port = process.env.PORT || 3001;

app.use(
  cors({
    origin: ["http://localhost:5173", "https://bitebuddy-by-fatema.surge.sh"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.get("/", function (req, res) {
  res.send("Hello World");
});

// router
app.use("/foods", foodRouter);
app.use("/auth", verifyRouter);

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  })
  .catch(console.dir);
