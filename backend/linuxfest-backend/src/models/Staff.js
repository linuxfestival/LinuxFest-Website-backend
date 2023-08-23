const mongoose = require("mongoose");
const persianize = require("persianize");
const { BASEURL } = require("./../config/index.js");

const schema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
      validate(value) {
        if (!persianize.validator().alpha(value)) {
          throw new Error("نام معتبر نمیباشد");
        }
      },
    },
    firstname_en: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
      validate(value) {
        if (!persianize.validator().alpha(value)) {
          throw new Error("نام معتبر نمیباشد");
        }
      },
    },
    lastname_en: {
      type: String,
      required: true,
    },
    picPath: {
      type: String,
    },
    responsibility: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

schema.methods.toJSON = function () {
  const staff = this;
  const staffObject = staff.toObject();

  const url = `/${BASEURL}/staffs/pic/${staffObject._id}`;
  if (staffObject.picPath) {
    delete staffObject.picPath;
    staffObject.picUrl = url;
  }

  return staffObject;
};

const Staff = mongoose.model("Staff", schema);

module.exports = Staff;
