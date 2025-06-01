import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        password: {
            type: String,
            required: function () {
                return !this.googleId; // Password is required only if not using Google auth
            },
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        profileImage: {
            type: String,
            default: "",
        },
        tasks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Task",
            },
        ],
    },
    {
        timestamps: true,
        autoIndex: true,
        bufferCommands: false,
    }
);

// Create indexes
userSchema.index({ email: 1, googleId: 1 }, { unique: true, sparse: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Add static method to find user by email with retry
userSchema.statics.findByEmail = async function (email, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await this.findOne({ email });
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
    }
};

// Add static method to find or create user with retry
userSchema.statics.findOrCreate = async function (query, data, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            let user = await this.findOne(query);
            if (!user) {
                user = new this(data);
                await user.save();
            }
            return user;
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
    }
};

export default mongoose.model("User", userSchema);
