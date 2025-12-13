import { Model, Schema, model, Types } from 'mongoose';
import { hash, compare } from 'bcrypt';

interface IUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // Optional during updates
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  roles: string[]; // e.g., ['user', 'admin']
  profilePicture?: string; // URL or path to profile picture
  lastLogin?: Date;
  // Add any other relevant user properties here
}

// Extend the mongoose.Model type to include custom methods
interface UserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  verifyPassword(password: string, hashedPassword?: string): Promise<boolean>;
}


const UserSchema = new Schema<IUser, UserModel>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please enter a valid email address',
      ],
    },
    password: { type: String, required: true, minlength: 8 },
    isActive: { type: Boolean, default: true },
    roles: { type: [String], default: ['user'] },
    profilePicture: { type: String, default: null },
    lastLogin: { type: Date, default: null },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Hash the password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await hash(this.password!, saltRounds); // Non-null assertion because password is required
    this.password = hashedPassword;
    return next();
  } catch (error) {
    return next(error as Error);
  }
});

// Custom static method to find a user by email
UserSchema.statics.findByEmail = async function (email: string) {
  return this.findOne({ email });
};

// Custom method to verify password
UserSchema.methods.verifyPassword = async function (password: string, hashedPassword?: string): Promise<boolean> {
  try {
    const passwordToCompare = hashedPassword || this.password;
    if (!passwordToCompare) {
      return false; // Or throw an error, depending on your needs
    }
    return await compare(password, passwordToCompare);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

const User = model<IUser, UserModel>('User', UserSchema);

export { User, IUser, UserModel };