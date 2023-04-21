const { errorResponse } = require("../helpers/responseHandler");
const User = require("../models/users");

const isAdmin = async(req, res, next) => {
    try{
        if(req.session.userId) {
            console.log(req.session.userId)
            const id = req.session.userId;
            const adminData = await User.findById(id);
            if (adminData?.is_admin === 1) {
                next();
            } else {
                errorResponse(res, 400, 'you are not an admin')
            }
            
        } else {
            errorResponse(res, 400, 'please login')
        }
    } catch (error) {
        console.log(error);
    }
};

module.exports = { isAdmin }