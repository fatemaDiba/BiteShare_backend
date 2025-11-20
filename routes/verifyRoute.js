import express from "express";
import jwt from "jsonwebtoken";

const verifyRouter = express.Router();

verifyRouter.post("/jwt", async (req, res) => {
  const email = req.body;
  try {
    const token = jwt.sign(email, process.env.JWT_ACCESS_TOKEN, {
      expiresIn: "5h",
    });
    if (!token) {
      return res.status(401).send({ message: "Can not generate Token" });
    }

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .send({ success: true });
  } catch (error) {
    res.status(500).send({ message: "Something went wrong on server side" });
  }
});

verifyRouter.post("/logout", async (req, res) => {
  try {
    res
      .clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .send({ success: true });
  } catch (error) {
    res.status(500).send({ message: "Something went wrong on server side" });
  }
});

export default verifyRouter;
