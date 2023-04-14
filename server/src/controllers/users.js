const jwt = require("jsonwebtoken");

const { securePassword } = require("../helpers/bcryptPassword");
const User = require("../models/users");
const dev = require("../config");

const registerUser = async(req,res) => {
    try{
        const { name,email,phone,password }= req.fields;
        const { image }=req.files;

        if(!name || !email || !phone || !password){
            return res.status(404).json({
                message: "name, email, phone or password is missing",
            });
        }

        if( password.length < 6 ){
            return res.status(404).json({
                message: "minimum length of password is 6",
            });
        }

        if( image && image.size > 1000000 ){
            return res.status(400).json({
                message: "maximum size for image is 1mb",
            });
        }

        const isExist = await User.findOne({email: email})
        if(isExist){
            return res.status(400).json({
                message: "user with this email already exist",
            });
        }

        const hashedPassword = await securePassword( password );
        //store the data
        const token = jwt.sign({ name, email, phone, hashedPassword, image }, dev.app.jwtSecretKey );
        console.log(token);

        res.status(201).json({
            token: token,
        });
    }catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = { registerUser };