const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { sendWelcome, sendFarewell } = require('../emails/account');
const router = express.Router();

const emailNotifs = false;

// read user profile
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);

    // User.find({}).then((users) => {
    //     if (!users) return res.status(204).send();
    //     res.send(users);
    // }).catch((err) => {
    //     res.status(500).send();
    // })
})

// create new user
router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        const token = await user.generateAuthToken();
        if (emailNotifs) sendWelcome(user.email, user.name);
        res.status(201).send({ user, token });
    } catch (err) {
        res.status(400).send(err.message);
    }

    // user.save().then(() => {
    //     res.status(201).send(user);
    // }).catch((err) => {
    //     res.status(400).send(err.message);
    // })
})

// login user profile
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (err) {
        res.status(400).send(err.message);
    }
})

// logout user
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        })

        await req.user.save();

        res.send();
    } catch (err) {
        res.status(500).send(err.message);
    }
})

// terminate all login sessions
router.post('/users/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = []

        await req.user.save();

        res.send();
    } catch (err) {
        res.status(500).send(err.message);
    }
})

// update user profile data
router.patch('/users/me', auth, async (req, res) => {
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const updates = Object.keys(req.body);

    // check if every element of provided values to be updated is present in the allowed list
    // if using shorthand can skip the return word
    const isValid = updates.every((el) => allowedUpdates.includes(el));

    // If not using shorthand, need to use return keyword, otherwise result will always be false
    // const isValid = updates.every((el) => {
    //     return allowedUpdates.includes(el);
    // })

    // terminate execution if user attempts to update invalid document property
    if (!isValid) return res.status(403).send({error: {message: "Attempted invalid update operation"}});

    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update];
        })

        await req.user.save();

        //const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true });
        res.status(201).send(req.user);
    } catch (error) {
        res.status(400).send(error.message);
    }
})

// delete user profile
router.delete('/users/me', auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id);
        // if (!user) return res.status(204).send({ "message": "User not found." });

        await req.user.remove();
        if (emailNotifs) sendFarewell(req.user.email, req.user.name);
        res.send(req.user);
    } catch (err) {
        res.status(500).send(err.message);
    }
})

const avatar = multer({
    //dest: 'avatars',
    limits: {
        fileSize: 1024000
    },
    fileFilter(req, file, cb){
        const validExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];

        // regular expressions
        if (!file.originalname.match(/\.([pP][nN][gG]|[jJ][pP][eE]?[gG]|[bB][mM][pP]|[gG][iI][fF])$/)) {
            return cb(new Error('File extension invalid'));
        }

        if (!validExtensions.includes(path.extname(file.originalname.toLowerCase()))) {
            return cb(new Error('File extension invalid'));
        }

        cb(undefined, true);
        // cb(new Error('File must be an image'));
        // cb(undefined, true);
        // cb(undefined, false);
    }
})

// retrieve own avatar by authentication
router.get('/users/me/avatar', auth, async (req, res) => {
    try {
        if (!req.user.avatar) {
            throw new Error('Avatar not found');
        }

        res.set('Content-Type', 'image/jpg');
        res.send(req.user.avatar);
    } catch (err) {
        res.status(404).send({error: err.message});
    }
})

// retrieve any users avatar by ID
router.get('/users/:id/avatar', async (req, res) => {
    const user = await User.findById(req.params.id)
    try {
        if (!user || !user.avatar) {
            throw new Error('User avatar not found');
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (err) {
        res.status(404).send({error: err.message});
    }
})

// upload an avatar
router.post('/users/me/avatar', auth, avatar.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 88, height: 88 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.status(200).send();
}, (err, req, res, next) => {
    res.status(400).send({ error: err.message });
})

// delete avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.status(200).send();
}, (err, req, res, next) => {
    res.status(400).send({ error: err.message });
})

module.exports = router;