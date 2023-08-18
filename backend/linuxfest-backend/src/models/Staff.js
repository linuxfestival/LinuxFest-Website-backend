const mongoose = require('mongoose');
const persianize = require('persianize');
const { BASEURL } = require('./../config/index.js')

const staffSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate(values) {
        for (const value of values.split(" ")) {
          if (!persianize.validator().alpha(value)) {
            throw new Error("نام معتبر نمیباشد");
          }
        }
      },
    },
    fullName_en: {
      type: String,
      required: true,
      trim: true,
    },
    imagePath: {
      type: String,
    },
    responsibility: {
      type: String,
      required: true,
    },
    responsibility_en: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

staffSchema.methods.toJSON = function () {
  const staff = this;
  const staffObject = staff.toObject();

  const url = `/${BASEURL}/staff/pic/${staffObject._id}`;
  if (staffObject.imagePath) {
    delete staffObject.imagePath;
    staffObject.picUrl = url;
  }
  return staffObject;
};

const Staff = mongoose.model("Staff", staffSchema);

module.exports = Staff;
