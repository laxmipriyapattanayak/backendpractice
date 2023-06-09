//const formidable = require("express-formidable");
const session = require("express-session");
const router = require("express").Router();


const { registerUser, 
        verifyEmail, 
        loginUser, 
        logoutUser, 
        userProfile, 
        deleteUser, 
        updateUser,
        forgetPassword,
        resetPassword
     } = require("../controllers/users");    
const dev = require("../config");
const { isLoggedIn, isLoggedOut } = require("../middlewares/auth");
const upload = require("../middlewares/fileUpload");

router.use(
    session({
        name: 'user_session',
        secret: dev.app.sessionSecretKey || 'ghghgjh',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false, maxAge: 10 * 6000 },
    })
);
//upload.single('image'),
router.post("/register", upload.single('image'), registerUser);
router.post("/verify-email", verifyEmail );
router.post("/login", isLoggedOut, loginUser);
router.get("/logout",isLoggedIn, logoutUser);
router
.route('/')
.get(isLoggedIn, userProfile)
.delete(isLoggedIn, deleteUser)
.put(isLoggedIn, upload.single('image'), updateUser);
router.post("/forget-password", isLoggedOut, forgetPassword);
router.post('/reset-password', isLoggedOut, resetPassword);

module.exports = router;