const fs = require("fs");
const jwt = require("jsonwebtoken");

const { securePassword, comparePassword } = require("../helpers/bcryptPassword");
const User = require("../models/users");
const dev = require("../config");
const { sendEmailWithNodeMailer } = require("../helpers/email");
const { successResponse, errorResponse } = require("../helpers/responseHandler");

const registerUser = async(req,res) => {
    try{
        const { name, email, password, phone }= req.body;
        const { image } = req.body;

        if(!name || !email || !phone || !password){
            errorResponse(res, 400, 'name, email, phone or password is missing')
        }

        if( password.length < 6 ){
            errorResponse(res, 400, 'minimum length of password is 6')
        }

        if( image && image.size > 1000000 ){
            errorResponse(res, 400, 'maximum size for image is 1mb')
        }

        const isExist = await User.findOne({email: email})
        if(isExist){
            errorResponse(res, 400, 'user with this email already exist')
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
        successResponse(res, 201, 'A varification link has been sent to your email', token)
    }catch (error) {
        errorResponse(res, 500, error.message)
    }
};
const verifyEmail = async (req,res) => {
    try{
        const { token } = req.body;
        if( !token ){
            errorResponse(res, 404, 'token is missing')
        }

        jwt.verify(token, dev.app.jwtSecretKey, async function(err,decoded) {
            if(err){
                errorResponse(res, 401, 'token is expire')
            }
            const { name, email, phone, hashedPassword, image } = decoded;
           const isExist = await User.findOne({ email: email});
           if ( isExist ) {
            errorResponse(res, 400, 'user with this email already exist')
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
                errorResponse(res, 400, 'user was not created')
            }

            successResponse (res, 201, 'user was created.ready to sign in')
        });
        
    } catch (error){
        errorResponse(res, 500, error.message)
    }
};
const loginUser = async (req,res) => {
    try {
        const {email, password} = req.body;
        if( !email || !password) {
            errorResponse(res, 400, 'email or password is missing')
        }

        if(password.length < 6){
            errorResponse(res, 400, 'minimum length for password is 6')
        }
        const user = await User.findOne({ email })
        if (!user) {
            errorResponse(res, 400, 'user with this email doesnot exist' )
        }
        if(user.isBanned)
        errorResponse(res, 401, 'user is banned');

        const isPasswordMatched = await comparePassword(password, user.password)

         if (!isPasswordMatched) {
            errorResponse(res, 401, 'email/password mismatched' )
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
        errorResponse(res, 500, error.message)
    }
};
const logoutUser = (req,res) => {
    try {
        req.session.destroy();
        res.clearCookie("user_session")
        successResponse (res, 200, 'logout successful')
    } catch (error) {
        errorResponse(res, 500, error.message )
    }
};

const userProfile = async (req,res) => {
    try {
        const userData = await User.findById(req.session.userId, { password: 0 });
        successResponse (res, 200, 'profile is returned',userData)

    } catch (error) {
        errorResponse(res, 500, error.message )
    }
};

const deleteUser = async (req,res) => {
    try {
        await User.findByIdAndDelete(req.session.userId);
        successResponse (res, 200, 'user was deleted successfully')
    } catch (error) {
        errorResponse(res, 500, error.message )
    }
};
const forgetPassword =async (req,res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            errorResponse(res, 404, 'email or password is missing' )
        }
        if(password.length < 6) {
            errorResponse(res, 400, 'minimum length for password is 6' )
        }

        const user = await User.findOne({email: email});
        if(!user) return res.status(400).json({message : "user was not found with this email address" });

        const hashedPassword = await securePassword(password);

        const token = jwt.sign(
            { email, hashedPassword },
            dev.app.jwtSecretKey ,
            {expiresIn: '10m' }
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
        successResponse (res, 200, 'an email has been sent for reset password',token)

    } catch (error) {
        errorResponse(res, 500, error.message )
    }
};
const resetPassword = async (req,res) => {
    try {
        const { token } =req.body;
        if(!token) {
            errorResponse(res, 404, 'token is missing' )
        }
        jwt.verify(token, dev.app.jwtSecretKey, async function (err,decoded) {
            if (err) {
                errorResponse(res, 401, 'token is expired' )
            }
            //decoded the data
            const { email, hashedPassword } = decoded;
            const foundUser = await User.findOne({ email: email});
            if(!foundUser) {
                errorResponse(res, 400, 'user with this email already exist' )
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
                errorResponse(res, 400, 'reset password was not successful' )
            }
            successResponse (res, 200, 'reset password was successful')
        });
    }catch(error){
        errorResponse(res, 500, error.message )
    }
}

const updateUser = async (req, res) => {
    try {
        const hashedPassword = await securePassword(req.body.password);
        const updatedData = await User.findByIdAndUpdate(
            req.session.userId,
            {... req.body, password: hashedPassword },// image: req.file.filename.image },
            { new: true }
            );

            if(!updatedData){
                errorResponse(res, 400, 'user was not updated' )
            }
            await updatedData.save()

            successResponse(res, 200,'user was updated successfully')
        } catch (error) {
            errorResponse(res, 500, error.message )
    }
};
module.exports = { registerUser,verifyEmail,loginUser,
                   logoutUser, userProfile, deleteUser, 
                   updateUser, forgetPassword, resetPassword };