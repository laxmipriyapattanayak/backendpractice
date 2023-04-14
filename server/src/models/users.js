const {Schema,model} = require("mongoose");

const userSchema= new Schema({
    name: {
        type: String,
        trim: true,
        required: [true,"name is required"],
        minlength: [2,"min length for name is 2 characters"],
        maxlength: [100,"maximum length for name is 100 characters"],
    },
    email: {
        type:String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        validate:{
            validator: function(v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v)
            },
            message: "please enter a valid email",
        },
    },
    password:{
        type: String,
        min: 6,
        required: [true,"password is required"]
    },
    phone:{
        type: String,
        required: [true,"phone number  required"]
    },
    is_admin: {
        type: Number,
        default: 0
    },
    is_varified: {
        type: Number,
        default: 0 
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    image: {
        data: Buffer,
        contentType: String
    },
});

const User = model("users",userSchema);

module.exports = User;