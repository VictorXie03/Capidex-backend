const router = require('express').Router();
const User = require("../model/user");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

async function validateCookie(req, res, next) {
    const cookies = req.cookies;
    if ('token' in cookies) {
        try {
            const userid = jwt.verify(cookies.token, process.env.JWT_SECRET).id
            res.locals.userid = userid
            const userinfo = await User.findOne({ _id: userid });
            res.locals.username = userinfo.name
            next();
        } catch {
            res.status(403).send([])
        }
    } else {
        res.status(403).send([])
    }
}


router.post('/login', async (req, res) => {
    const cookies = req.cookies;
    if ('token' in cookies) {
        const userid = jwt.verify(cookies.token, process.env.JWT_SECRET).id
        const userinfo = await User.findOne({ _id: userid });
        return res.status(200).json(userinfo)
    }
    const { username, password } = req.body
    const user = await User.findOne({ username }).lean()
    if (!user) {
        return res.json({ status: 'error', error: 'Invalid username/password' })
    }

    if (await bcrypt.compare(password, user.password)) {
        // the username, password combination is successful
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);

        res.cookie("token", token, {
            httpOnly: true,
        });
        return res.json({ status: 'ok', data: token })
    }
    res.json({ status: 'error', error: 'Invalid username/password' })
})

router.post('/register', async (req, res) => {
    const { username, password: plainTextPassword } = req.body

    if (!username || typeof username !== 'string') {
        return res.json({ status: 'error', error: 'Invalid username' })
    }

    if (!plainTextPassword || typeof plainTextPassword !== 'string') {
        return res.json({ status: 'error', error: 'Invalid password' })
    }

    if (plainTextPassword.length < 5) {
        return res.json({ status: 'error', error: 'password needs to be minimum 5 characters' })
    }

    const password = await bcrypt.hash(plainTextPassword, 10)


    try {

        const response = await User.create({
            username,
            password
        })
        console.log('User created successfully: ', response)
    } catch (error) {
        if (error.code === 11000) {
            return res.json({ status: 'error', error: 'Username taken' })
        }
        throw error
    }
    res.json({ status: 'ok' })
})

router.get('/logout', async (req, res) => {
    try {
        res.cookie('token', 0, { sameSite: 'none', secure: true, maxAge: 1 })
        res.send({ msg: 'Logged out' })
    } catch (err) {
        res.json({ msg: err });
    }
})

module.exports = router;
module.exports.validateCookie = validateCookie;