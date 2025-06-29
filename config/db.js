import mongoose from "mongoose";
import config from "./constant.js";
const connectDB = async () => {
  try {
      await mongoose.connect("mongodb+srv://bhupeshkr2912:TzPTM4Bz0QusY00O@google-drive-clustor.vrpzvom.mongodb.net/?retryWrites=true&w=majority&appName=google-drive-clustor", {
    //   await mongoose.connect("mongodb+srv://bhupeshkr2912:TzPTM4Bz0QusY00O@cluster0.dbe8y5j.mongodb.net/", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, 
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log("Error connecting to MongoDB:", err);
  }
};

export default connectDB;
//TzPTM4Bz0QusY00O