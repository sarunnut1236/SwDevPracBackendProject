const User = require("../models/Users");

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public

exports.register = async (_request, response, next) => {
    try {
        const { name, email, password, role } = _request.body;

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role,
        });

        // const token = user.getSignedJwtToken();
        // response.status(200).json({success: true, token});
        sendTokenResponse(user, 200, response);
    } catch (error) {
        response.status(400).json({ success: false });
        console.log(error.stack);
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (_request, response, next) => {
    const { email, password } = _request.body;
    // Validate email and password
    if (!email || !password) {
        return response.status(400).json({
            success: false,
            message: "Please provide an email and password",
        });
    }
    // Check for user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return response
            .status(400)
            .json({ success: false, message: "Invalid credentials" });
    }
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        return response
            .status(401)
            .json({ success: false, message: "Invalid credentials" });
    }
    // Create token
    // const token = user.getSignedJwtToken();
    // response.status(200).json({success: true, token});
    sendTokenResponse(user, 200, response);
};

const sendTokenResponse = (user, statusCode, response) => {
    // Create token
    const token = user.getSignedJwtToken();
    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
        ),
        httpOnly: true,
    };
    if (process.env.NODE_ENV === "production") {
        options.secure = true;
    }
    response.status(statusCode).cookie("token", token, options).json({
        success: true,
        token,
    });
};

// @desc    Get current logged in user
// @route   POST /api/v1/auth/me
// @access  Private
exports.getMe = async (_request, response, next) => {
    const user = await User.findById(_request.user.id);
    response.status(200).json({
        success: true,
        data: user,
    });
};