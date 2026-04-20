import { User } from '../models/user.models.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import { emailVerificationMailGenContent, sendEmail } from '../models/mail.js';
import { asyncHandler } from '../utils/async-handler.js';


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
export { registerUser, loginUser };