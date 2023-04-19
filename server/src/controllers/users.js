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
            return res.status(400).json({
                message: "name, email, phone or password is missing",
            });
        }

        if( password.length < 6 ){
           return res.status(400).json({
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
                message: "user with this email doesn't exist",
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

const userProfile = async (req,res) => {
    try {
        const userData = await User.findById(req.session.userId, { password: 0 });
        res.status(200).json({
            ok: true,
            message: "profile is returned",
            user: userData,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const deleteUser = async (req,res) => {
    try {
        await User.findByIdAndDelete(req.session.userId);
        res.status(200).json({
            ok: true,
            message: "user was deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
const forgetPassword =async (req,res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(404).json({
                message: 'email or password is missing',
            });
        }
        if(password.length < 6) {
            return res.status(404).json({
                message: 'minimum length for password is 6',
            });
        }

        const user = await User.findOne({email: email});
        if(!user) return res.status(400).json({message : "user was not found with this email address" });

        const hashedPassword = await securePassword(password);

        const token = jwt.sign(
            { email, hashedPassword },
            dev.app.jwtSecretKey,
            {expireIn: '10m' }
        );
        //prepare the email
        const emailData = {
            email,
            subject: 'account activation email',
            html: `
            <h2> Hello ${user.name}! </h2>
            <p> please click here to <a href="${dev.app.clientUrl}/api/users/
            reset-password?token=${token}" target="_blank">reset your password</a> </p>
            `
        };
        sendEmailWithNodeMailer(emailData);
        res.status(200).json({
            ok: true,
            message: 'an email has been sent for reset password',
            token: token,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
const resetPassword = async (req,res) => {
    try {
        const { token } =req.body;
        if(!token) {
            return res.status(404).json({
                message: 'token is missing',
            });
        }
        jwt.verify(token, dev.app.jwtSecretKey, async function (err,decoded) {
            if (err) {
                return res.status(401).json({
                    message: 'token is expired',
                });
            }
            //decoded the data
            const { email, hashedPassword } = decoded;
            const isExist = await User.findOne({ email: email});
            if(isExist) {
                return res.status(400).json({
                    message: 'user with this email already exist',
                });
            }
            //update the user
            const updateData = await User.updateOne(
                { email: email },
                {
                    $set: {
                        password: hashedPassword,
                    },
                }
            ) ;
            if(!updateData){
                res.status(400).json({
                    message: 'reset password was not successful',
                });
            }
            res.staus(200).json({
                message: 'reset password was successful',
            })
        });
    }catch(error){
        res.status(500).json({
            message: error.message 
        });
    }
}

const updateUser = async (req, res) => {
    try {
        if(!req.fields.password){
            //
        }
        const hashedPassword = await securePassword(req.fields.password);
        const updatedData = await User.findByIdAndUpdate(
            req.session.userId,
            {... req.fields, password: hashedPassword },
            { new: true }
            );

            if(!updatedData){
                res.status(400).json({
                    ok: false,
                    message: 'user was not updated',
                });
            }
            if(req.files.image){
                const {image} =req.files
                updatedData.image.data = fs.readFileSync(image.path);
                updatedData.image.contentType = image.type;
            }
            await updatedData.save()
            res.status(200).json({
                ok: true,
                message: 'user was updated successfully',
            });
        } catch (error) {
            res.status(500).json({
                message: error.message,
        })
    }
};
module.exports = { registerUser,verifyEmail,loginUser,
                   logoutUser, userProfile, deleteUser, 
                   updateUser, forgetPassword, resetPassword };