import { Schema, model, Document, Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { S_User, E_UserRole } from '../interfaces/S_User';

// Define the interface for the User Document, extending the base interface and Mongoose Document
export interface AM_UserModel extends S_User, Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
    // Add any instance methods here if needed
}

// Define the static methods interface for the User Model
interface AM_UserStaticModel extends Model<AM_UserModel> {
    // Add any static methods here if needed
}

const UserSchema = new Schema<AM_UserModel, AM_UserStaticModel>({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 8,
        select: false, // Do not return the password by default
    },
    role: {
        type: String,
        enum: Object.values(E_UserRole),
        default: E_UserRole.BASIC,
        required: true,
    },
    firstName: {
        type: String,
        trim: true,
        maxlength: 50,
    },
    lastName: {
        type: String,
        trim: true,
        maxlength: 50,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'users',
});

// --- Pre-save Hook for Password Hashing ---
UserSchema.pre<AM_UserModel>('save', async function (next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    try {
        // Hash the password with a cost factor of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// --- Instance Method for Password Comparison ---
/**
 * Compares a candidate password with the stored hashed password.
 * @param candidatePassword The password provided by the user during login.
 * @returns A promise that resolves to true if passwords match, false otherwise.
 */
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    // 'this.password' must be explicitly selected in the query for this to work
    if (!this.password) {
        // If password was not selected, we cannot compare. This should be handled by selecting the password field in the query.
        throw new Error("Password field was not selected for comparison.");
    }
    return bcrypt.compare(candidatePassword, this.password);
};

// --- Indexing for performance ---
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });

// Export the Mongoose Model
export const AM_User = model<AM_UserModel, AM_UserStaticModel>('User', UserSchema);