import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    passwordLastChanged: {
      type: Date,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password before saving
userSchema.pre('save', async function () {
  // If the password hasn't changed, exit early
  if (!this.isModified('password')) {
    return; // <-- Resolves the promise immediately. Mongoose proceeds to save.
  }
  // Otherwise, run the rest of the code
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordLastChanged = Date.now();
  
  // No next() needed at the end!
});

const User = mongoose.model("User", userSchema);

export default User;
