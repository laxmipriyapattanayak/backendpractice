const errorResponse = (res, statusCode, message) =>{
    return res.status(statusCode).json({
        ok: false,
        message: message,
    });
}
const successResponse = (res, statusCode, message, data={}) =>{
    return res.status(statusCode).json({
        ok: true,
        message: message,
        data: data,
    });
}

module.exports = {errorResponse, successResponse};