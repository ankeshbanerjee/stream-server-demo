import mongoose from "mongoose";

export async function connectToDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      dbName: "stream-server-demo-db",
    });
    console.log("db connected");
  } catch (error) {
    console.log(error);
  }
}
