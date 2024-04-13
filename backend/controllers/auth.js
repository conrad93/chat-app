const bcrypt = require("bcryptjs");
const generateTokenAndSetCookie = require("../utils/generateToken");
const User = require("../models/user");

const login = async (req, res) => {
    try {
        const {username, password} = req.body;

        const user = await User.findOne({username});
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || '');

        if(!user || !isPasswordCorrect){
            return res.status(400).json({error: "Invalid username or password"});
        }
        
        generateTokenAndSetCookie(user._id, res);
        
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            gender: user.gender,
            username: user.username,
        });

    } catch (error) {
        console.log("Error in login", error.message);
        res.status(500).json({error: "Internal server error"});
    }
}

const signup = async (req, res) => {
    try {
        const {fullName, username, password, confirmPassword, gender} = req.body;

        if(password !== confirmPassword){
            return res.status(400).json({error: "Passwords don't match"});
        }

        const user = await User.findOne({username});

        if(user){
            return res.status(400).json({error: "User already exists"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            username,
            password: hashedPassword,
            gender
        });

        if(newUser){
            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save();
    
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                gender: newUser.gender,
                username: newUser.username,
            });
        } else {
            res.status(400).json({error: "Invalid user data"});
        }

    } catch (error) {
        console.log("Error in signup", error.message);
        res.status(500).json({error: "Internal server error"});
    }
}

const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", {maxAge: 0});
        res.status(200).json({message: "Logged out successfully"});

    } catch (error) {
        console.log("Error in logout", error.message);
        res.status(500).json({error: "Internal server error"});
    }
}

module.exports = {
    login,
    signup,
    logout
};