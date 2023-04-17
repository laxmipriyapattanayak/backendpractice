const fs = require("fs");
const jwt = require("jsonwebtoken");

const { securePassword, comparePassword } = require("../helpers/bcryptPassword");
const User = require("../models/users");
const dev = require("../config");
const { sendEmailWithNodeMailer } = require("../helpers/email");

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
        const token = jwt.sign({ name, email, phone, hashedPassword, image }, 
                dev.app.jwtSecretKey, { expiresIn: "10m" }
        );
        
        //prepare email
        const emailData={
            email,
            subject: "Acount Activation Email",
            html: `
            <h2> Hello ${name}! </h2>
            <p> please click here to <a href="${dev.app.clientUrl}/api/users/activate?token=${token}" target="_blank">activate your account </a></p>
            `,
        };

        sendEmailWithNodeMailer(emailData)
        res.status(201).json({
            message: 'A varification link has been sent to your email',
            token: token,
        });
    }catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
const verifyEmail = async (req,res) => {
    try{
        const { token } = req.body;
        if( !token ){
            return res.status(404).json({
                message: "token is missing",
            });
        }

        jwt.verify(token, dev.app.jwtSecretKey, async function(err,decoded) {
            if(err){
                return res.status(401).json({
                    message: "token is expire"
                })
            }
            const { name, email, phone, hashedPassword, image } = decoded;
           const isExist = await User.findOne({ email: email});
           if ( isExist ) {
            return res.status(400).json({
                message: "user with this email already exist",
            });
           }
           //create user
           const newUser = new User({
            name : name,
            email : email,
            password : hashedPassword,
            phone : phone,
            is_varified: 1,
           })

            if(image){
                newUser.image.data = fs.readFileSync(image.path);
                newUser.image.contentType = image.type;
            }

            const user = await newUser.save()
            if(!user){
                res.status(400).json({
                    message: "user was not repeated",
                });
            }
                res.status(201).json({
                    message: "user was created.ready to sign in",
                });
        });
        
    } catch (error){
        res.status(500).json({
            message: error.message,
        });
    }
};
const loginUser = async (req,res) => {
    try {
        const {email, password} = req.body;
        if( !email || !password) {
            return res.status(404).json({
                message: "email or password is missing",
            });
        }

        if(password.length < 6){
            return res.status(404).json({
                message: "minimum length for password is 6",
            })
        }
        const user = await User.findOne({ email: email })
        if (!user) {
            return res.status(400).json({
                message: "user with this email doesn't exist",
            });
        }
         const isPasswordMatched = await comparePassword(password, user.password)

         if (!isPasswordMatched) {
            return res.status(400).json({
                message:"email/password mismatched",
            });
         }

         req.session.userId = user._id;

        res.status(200).json({
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
const logoutUser = (req,res) => {
    try {
        req.session.destroy();
        res.clearCookie("user_session")
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

const userProfile = (req,res) => {
    try {
        res.status(200).json({
            messahe: "profile is returned",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
}
module.exports = { registerUser,verifyEmail,loginUser,logoutUser, userProfile };