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
      const parts = value.split(" ");
      for (const part of parts) {
        if (!persianize.validator().alpha(part)) {
          throw new Error('نام معتبر نمیباشد')
        }
      }
    }
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      const parts = value.split(" ");
      for (const part of parts) {
        if (!persianize.validator().alpha(part)) {
          throw new Error('نام خانوادگی معتبر نمیباشد')
        }
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
  phoneNumber: {
    type: String,
    minlength: 11,
    maxlength: 12,
    validate(value) {
      if (!validator.isNumeric(value) || !value.startsWith("09")) {
        throw new Error("شماره تماس نامعتبر است");
      }
    },
    required: true
  },
  studentNumber: {
    type: String,
    minlength: 7,
    maxlength: 8,
    unique: true,
    validate(value) {
      if (!validator.isNumeric(value)) {
        throw new Error("شماره دانشجویی نامعتبر است");
      }
    }
  },
  age: {
    type: Number,
    min: 16,
    max: 99
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
  }],
  forgotTokens: [
    {
      forgotToken: {
        type: String,
        required: true
      }
    }
  ]
}, {
  timestamps: true
});



schema.statics.findByCredentials = async function (email, password) {
  const user = await User.findOne({ email });

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


schema.methods.generateForgotToken = async function (email) {
  const user = this;
  const forgotToken = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "1 day"
  });
  user.forgotTokens = user.forgotTokens.concat({ forgotToken });

  await user.save();

  return forgotToken;
};

schema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.forgotTokens;

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
