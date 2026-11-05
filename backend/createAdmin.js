import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // ya "bcrypt" jo bhi aapke package.json mein ho
import dotenv from "dotenv";
dotenv.config();

// Apna User model import karein (path check kar lein)
import User from "./models/User.js"; 

async function createAdmin() {
  try {
    await mongoose.connect("mongodb+srv://kashifdesigner12_db_user:UvO4sAlNItgsQxTn@cluster0.r3m2mff.mongodb.net/school_management_db?appName=Cluster0" );
    console.log("Connected to Live DB");

    const email = "admin@localpro.com";
    const rawPassword = "adminpassword123";

    // Check existing
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("User already exists! Updating password...");
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      existing.password = hashedPassword;
      await existing.save();
      console.log("Password updated successfully!");
    } else {
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      await User.create({
        email,
        password: hashedPassword,
        name: "Admin User",
        role: "ADMIN", // agar role field use hoti hai
      });
      console.log("New Admin Created successfully!");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();