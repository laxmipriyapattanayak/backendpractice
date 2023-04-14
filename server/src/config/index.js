require("dotenv").config();

const dev={
    app: {
        serverPort:process.env.SERVER_PORT || 3001,
    },
};
module.exports = dev;