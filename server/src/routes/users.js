const formidable = require("express-formidable");
const router = require("express").Router();

const { registerUser } = require("../controllers/users");

router.post("/register", formidable(), registerUser);

module.exports = router;