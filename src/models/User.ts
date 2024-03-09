import mongoose, { type Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

export type IUser = {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  role: "admin" | "teacher" | "student";
  profilePicture?: string;
  client: { type: Schema.Types.ObjectId; ref: "Client" };
  status: string;
  emailVerified: boolean;
  verificationToken: string;
  verificationTokenExpires: Date;
  resetPasswordToken: string;
  resetPasswordExpires: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
} & Document;

const emailValidator = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const UserSchema: Schema = new Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [emailValidator, "Invalid email address format"],
    },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["admin", "teacher", "student"],
    },
    client: { type: Schema.Types.ObjectId, ref: "Client" },
    profilePicture: { type: String, required: false },
    status: {
      type: String,
      required: true,
      default: "active",
      enum: ["active", "inactive"],
    },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: "" },
    verificationTokenExpires: { type: Date, default: Date.now() },
    resetPasswordToken: { type: String, default: "" },
    resetPasswordExpires: { type: Date, default: Date.now() },
  },
  { timestamps: true },
);

UserSchema.pre<IUser>("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>("User", UserSchema);
