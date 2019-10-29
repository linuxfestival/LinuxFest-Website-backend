const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const persianize = require("persianize");

const schema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      if(!persianize.validator().alpha(value)){
        throw new Error('نام معتبر نمیباشد')
      }
    }
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      if(!persianize.validator().alpha(value)){
        throw new Error('نام خانوادگی معتبر نمیباشد')
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
        throw new Error("ایمیل معتبر نمی‌باشد");
      }
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    validate(value) {
      if (validator.isAlpha(value) || validator.isNumeric(value)) {
        throw new Error("رمزعبور ضعیف می‌باشد");
      }
    }
  },
  tokens: [
    {
      token: {
        type: String,
        required: true
      }
    }
  ],
  workshops: [{
    workshop: {
      type: mongoose.Types.ObjectId,
      required: true  
    }
  }]
},{
  timestamps: true
});



schema.statics.findByCredentials = async function (email, password) {
  const user = await User.findOne({email});

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("اطلاعات واردشده معتبر نمی‌باشد");
  }


  return user;
};

schema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "7 days"
  });

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

schema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;

  return userObject;
};

schema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

const User = new mongoose.model("User", schema);

module.exports = User;
