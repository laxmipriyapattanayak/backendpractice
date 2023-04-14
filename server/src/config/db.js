const mongoose = require("mongoose");
const dev = require(".");
const connectDatabase = async () => {
     try{
        await mongoose.connect(dev.db.url);
        console.log("database is connected");
     }catch (error) {
        console.log("database is not connected");
        console.log(error);
     }
};

module.exports = connectDatabase;