const fs = require("fs");
const jwt = require("jsonwebtoken");

const { securePassword, comparePassword } = require("../helpers/bcryptPassword");
const User = require("../models/users");
const dev = require("../config");
const { sendEmailWithNodeMailer } = require("../helpers/email");
const { errorResponse, successResponse } = require("../helpers/responseHandler");

const loginAdmin = async (req,res) => {
    try {
        const {email, password} = req.body;
        if( !email || !password) {
            errorResponse(res, 400, "email or password not found");
        }

        if(password.length < 6){
            errorResponse(res, 404, "minimum length for password is 6");
        }
        const foundUser = await User.findOne({ email })
        if (!foundUser) {
            errorResponse(res, 400, "user with this email does not exist. please register first");
        }

        if(foundUser.is_admin === 0){
            errorResponse(res, 400, 'not an admin');
        }
         const isPasswordMatched = await comparePassword(password, foundUser.password)

         if (!isPasswordMatched) {
            errorResponse(res, 401, "email/password mismatched");
         }

         req.session.userId = foundUser._id;

        return res.status(200).json({
            user: {
                name: foundUser.name,
                email: foundUser.email,
                phone: foundUser.phone,
                image: foundUser.image,
            },
            message: "login successful",
        });
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};
const logoutAdmin = (req,res) => {
    try {
        req.session.destroy();
        res.clearCookie("admin_session")

        successResponse(res, 200, 'logout successful')

    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};
const getAllUsers = async(req,res) => {
    try {
        const users = await User.find({is_admin : 0})

        successResponse(res, 200, 'returned all user', users)
    
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};
const deleteUserByAdmin = async(req,res) => {
    try {
        const {id} = req.params;
        const foundUser = await User.findById(id);
        if (!foundUser) 
            errorResponse(res, 400, 'user not found with this id');
        else
        await User.findByIdAndDelete(id);

        successResponse(res, 200, 'deleted user successfully')
        
    } catch (error) {
        
    }
}
module.exports = { loginAdmin, logoutAdmin, getAllUsers, deleteUserByAdmin };