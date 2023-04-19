const formidable = require("express-formidable");
const session = require("express-session");
const adminRouter = require("express").Router();
 
const dev = require("../config");
const { isLoggedIn, isLoggedOut } = require("../middlewares/auth");
const { loginAdmin, logoutAdmin, getAllUsers } = require("../controllers/admin");

adminRouter.use(
    session({
        name: 'admin_session',
        secret: dev.app.sessionSecretKey || 'ghghgjh',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false, maxAge: 10 * 6000 },
    })
);
adminRouter.post("/login", isLoggedOut, loginAdmin);
adminRouter.get("/logout",isLoggedIn, logoutAdmin);
adminRouter.get("/dashboard", isLoggedIn, getAllUsers);


module.exports = adminRouter;