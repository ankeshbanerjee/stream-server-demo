import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/user.model";
import { compare, genSaltSync, hash, hashSync } from "bcrypt";
import { StreamChat } from "stream-chat";

dotenv.config();

const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_SECRET_KEY!
);

const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Server is running!");
});

const saltRounds = 10;

app.post("/register", async (req: any, res: any) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed_password = await hash(password, saltRounds);
    const newUser = await User.create({
      email,
      hashed_password,
    });

    await serverClient.upsertUser({
      id: newUser._id.toString(),
      name: email,
    });

    const token = serverClient.createToken(newUser._id.toString());

    return res.status(201).json({
      user: newUser,
      token,
      message: "User registered successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/login", async (req: any, res: any) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || !(await compare(password, user.hashed_password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = serverClient.createToken(user._id.toString());

    return res.status(200).json({
      user,
      token,
      message: "User logged in successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/users", async (req: any, res: any) => {
  try {
    const users = await User.find();
    return res.status(200).json({
      users,
      message: "Users retrieved successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default app;
