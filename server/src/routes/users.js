const formidable = require("express-formidable");
const session = require("express-session");
const router = require("express").Router();


const { registerUser, verifyEmail, loginUser, logoutUser, userProfile } = require("../controllers/users");
const dev = require("../config");
const { isLoggedIn, isLoggedOut } = require("../middlewares/auth");

router.use(
    session({
        name: 'user_session',
        secret: dev.app.sessionSecretKey || 'ghghgjh',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false, maxAge: 10 * 6000 },
    })
);

router.post("/register", formidable(), registerUser);
router.post("/verify-email", verifyEmail );
router.post("/login", isLoggedOut, loginUser);
router.get("/logout",logoutUser);
router.get("/", isLoggedIn, userProfile);

module.exports = router;