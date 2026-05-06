import mongoose, {Schema} from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto, { hash } from 'crypto'

//mogoose schema have hooks and methods to add extra functionality to the schema. we can use pre and post hooks to perform some actions before and after saving the document. we can also use methods to add some custom methods to the schema.

const userSchema = new Schema({
    avatar: {
        type: {
            url: String,
            localPath: String
        },
        default: {
            url: ``,
            localPath: ""
        }
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String,
        trim:true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],  //make it required and pass the custom error.
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    refreshToken: {
        type: String
    },
    forgotPasswordToken: {
        type: String
    },
    forgotPasswordExpiry: {
        type: Date
    },
    emailVerificationToken: {
        type: String
    },
    emailVerificationExpiry: {
        type: Date
    }
},{timestamps:true});

//this is a pre hook that will run before saving the user document. it will run only if the password field is modified and hash it, not on any other field update.
//there is also a post hook that will run after saving the user document. it can also be performed in the same manner. 
userSchema.pre("save", async function(next){
        if(!this.isModified("password")) return;
        this.password = await bcrypt.hash(this.password,10);
    
})

//this is a custom method for this user schema that will compare the password entered by the user with the hashed password stored in the database. it will return true if the password is correct and false if it is incorrect.
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
}


userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateToken = function(){
    const unHashedToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex");

    const tokenExpiry = Date.now() + 20*60*1000;  //20mins
    return {unHashedToken, hashedToken, tokenExpiry};
}

export const User = mongoose.model("User", userSchema)

