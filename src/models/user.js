const mongoose = require('mongoose');
const validator = require('validator');
const bc = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const Task = require('./task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required:true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 6,
        validate(value){
            if (value.toLowerCase().includes("password")) {
                throw new Error('choose more complicated password');
            }
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is not valid');
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age cannot be negative');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'user'
})

userSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign({ _id: this._id.toString() }, process.env.JWTSECRET);

    this.tokens = this.tokens.concat({ token });
    await this.save();

    return token;
}

userSchema.methods.toJSON = function () {
    const usrObj = this.toObject();
    delete usrObj.password;
    delete usrObj.tokens;
    delete usrObj.avatar;
    return usrObj;
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})
    if (!user){
        throw new Error('Unable to login');
    }

    const isMatch = await bc.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Unable to login');
    }

    return user;
}

// hash the password before saving
userSchema.pre('save', async function (next){
    if (this.isModified('password')){
        this.password = await bc.hash(this.password, 8);
    }
    next();
})

// delete user tasks when user is deleted
userSchema.pre('remove', async function(next) {
    await Task.deleteMany({ user: this._id });
    next();
})

const User = mongoose.model('User', userSchema)

module.exports = User;