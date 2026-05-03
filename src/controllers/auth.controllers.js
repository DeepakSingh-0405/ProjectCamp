import { User } from '../models/user.models.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import { emailVerificationMailGenContent, forgotPasswordMailGenContent, sendEmail } from '../models/mail.js';
import { asyncHandler } from '../utils/async-handler.js';
import jwt from 'jsonwebtoken';


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "something went wrong in genrating refresh and access tokens");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    });
    if (existedUser) throw new ApiError(409, "Username or email already exists!", []);

    const user = await User.create({
        email: email,
        username: username,
        password: password,
        isEmailVerified: false
    })

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateToken()
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Email Verification",
        mailgenContent: emailVerificationMailGenContent(user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        )
    });

    const createdUser = await User.findById(user._id).select(
        "-password -emailVerificationToken -refreshToken -emailVerificationExpiry"
    )
    if (!createdUser) throw new ApiError(500, "Error occured in registering user", [])

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                { user: createdUser },
                "User registered successfully and verification email has been sent on your email",
            ),
        );

});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    if (!email) throw new ApiError(400, "email  is required", []);

    const user = await User.findOne({ email })
    if (!user) throw new ApiError(400, "user dosen't exists", []);

    const checkPassword = await user.isPasswordCorrect(password);
    if (!checkPassword) throw new ApiError(400, "invalid password");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select(
        "-password -emailVerificationToken -refreshToken -emailVerificationExpiry"
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    res.status(200)
        .cookie("access_token", accessToken, options)
        .cookie("refresh_token", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "user logged in successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken = ""
            },
        },
        { new: true }
    );
    const options = {
        httpOnly: true,
        secure: true
    }
    res.status(200)
        .clearCookie("access_token", options)
        .clearCookie("refresh_token", options)
        .json(
            new ApiResponse(200, "user logged out successfully", [])
        )
})

const getCurrentUser = asyncHandler(async(req,res) => {
    return res.status(200)
    .json(
        new ApiResponse(200,req.user,"user fetched successfully")
    )
})

const verifyEmail = asyncHandler(async(req,res) => {
    const {token} = req.params
    if(!token) throw new ApiError(400,"email token not available");

    const hashedToken = crypto
                        .createHash("sha256")
                        .update(token)
                        .digest("hex");
    
    const user = User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: {$gt: Date.now()}
    })
    if(!user) throw new ApiError(400,"invalid email or token is expired");

    user.emailVerificationToken = undefined
    user.emailVerificationExpiry = undefined
    user.isEmailVerified = true

    user.save({validateBeforSave:false});

    res
    .status(200)
    .json(
        new ApiResponse(200,{isEmailVerified:true},"email verified successfully")
    )
})

const resendEmailVerification = asyncHandler(async(req,res) => {
    const user = User.findById(req.user?._id);
    if(!user) throw new ApiError(401, "user not found");
    if(user.isEmailVerified) throw new ApiError(302, "user email already verified");

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateToken()
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Email Verification",
        mailgenContent: emailVerificationMailGenContent(user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        )
    });

    res
    .status(200)
    .json(
        new ApiError(200, "email verification mail resend successfully")
    )
})

const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refresh_token || req.body.refresh_token
    if(!incomingRefreshToken) throw new ApiError(401, "unauthorizeed access");

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )
    const user = User.findById(decodedToken?._id)

    if(!user) throw new ApiError(401, "unauthorized access: user not found");

    if(incomingRefreshToken !== user.refreshToken) throw new ApiError(401, "refresh token expired");

    const {accessToken, refreshToken: newRefreshToken} = generateAccessAndRefreshTokens(user._id);
    user.refreshToken = newRefreshToken
    user.save({validateBeforSave:false})

    const options = {
        httpOnly: true,
        secure: true
    }
    res
    .status(200)
    .cookie("access_token",accessToken,options)
    .cookie("refresh_token",newRefreshToken,options)
    .json(
        new ApiResponse(
        200, 
        {
            access_token: accessToken,
            refresh_token: newRefreshToken
        },
        "access token refreshed successfully"
    )
    );
})

const forgotPasswordRequest = asyncHandler(async(req,res) => {
    const {email} = req.body
    const user = User.findOne({email})
    if(!user) throw new ApiError(401,"unauthorized request");

     const { unHashedToken, hashedToken, tokenExpiry } = user.generateToken()
    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;
    await user.save({ validateBeforSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Forgot password Email",
        mailgenContent: forgotPasswordMailGenContent(user.username,
            `${process.env.FORGOT_PASSWORD_URL}/${unHashedToken}`
        )
    });

    res.status(200)
    .json(
        new ApiResponse(200,{},"forgot password mail has been sent!")
    );

})

const resetForgotPassword = asyncHandler(async(req,res) => {
    const {token} = req.params
    const {newPassword} = req.body

    if(!token) throw new ApiError(401,"unauthorized access");
    const hashedToken = crypto
                        .createHash("sha256")
                        .update(token)
                        .digest("hex")
    
    const user = User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: {$gt: Date.now()}
    })
    if(!user) throw new ApiError(401, "token is invalid or expired!");

    user.forgotPasswordExpiry = undefined
    user.forgotPasswordToken = undefined

    user.password = newPassword;
    user.save({validateBeforSave:false})

    res.status(200)
    .json(
        new ApiResponse(200, {}, "Password reset successfully!")
    )

})

const changePassword = asyncHandler(async(req,res) => {
    const {oldPassword, newPassword} = req.body;
    const user = User.findById(req.user?._id);
    if(!user) throw new ApiError(401,"Cannot change password due to unauthorized access");

    const isPasswordValid = await isPasswordCorrect(oldPassword);
    if(!isPasswordValid) throw new ApiError(401, "Old password is invalid");

    user.password = newPassword;
    user.save({validateBeforSave:false});

    res.status(200)
    .json(
        new ApiResponse(200,{}, "Password changed successfully.")
    )
})

export { 
    registerUser, 
    loginUser, 
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendEmailVerification,
    refreshAccessToken,
    forgotPasswordRequest,
    resetForgotPassword,
    changePassword
 };