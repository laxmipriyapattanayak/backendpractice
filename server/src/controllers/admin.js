const fs = require("fs");
const jwt = require("jsonwebtoken");

const { securePassword, comparePassword } = require("../helpers/bcryptPassword");
const User = require("../models/users");
const dev = require("../config");
const { sendEmailWithNodeMailer } = require("../helpers/email");

const loginAdmin = async (req,res) => {
    try {
        const {email, password} = req.body;
        if( !email || !password) {
            return res.status(400).json({
                message: "email or password is missing",
            });
        }

        if(password.length < 6){
            return res.status(400).json({
                message: "minimum length for password is 6",
            })
        }
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({
                message: "user with this email does not exist. please register first",
            });
        }

        if(user.is_admin === 0){
            return res.status(400).json({
                message: 'not an admin',
            });
        }
         const isPasswordMatched = await comparePassword(password, user.password)

         if (!isPasswordMatched) {
            return res.status(401).json({
                message:"email/password mismatched",
            });
         }

         req.session.userId = user._id;

        return res.status(200).json({
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                image: user.image,
            },
            message: "login successful",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
const logoutAdmin = (req,res) => {
    try {
        req.session.destroy();
        res.clearCookie("admin_session")
        res.status(200).json({
            ok: true,
            message: "logout successful",
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: error.message,
        });
    }
};
const getAllUsers = async(req,res) => {
    try {
        const users = await User.find({is_admin : 0})
        res.status(200).json({
            ok: true,
            message: "returned all user",
            users: users,
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: error.message,
        });
    }
};
module.exports = { loginAdmin, logoutAdmin, getAllUsers };