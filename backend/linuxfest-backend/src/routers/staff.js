const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const Jimp = require("jimp");

const Staff = require("../models/Staff");
const Workshop = require("../models/Workshop");
const { checkPermission } = require("../utils/utils");
const { authenticateAdmin } = require("../express_middlewares/adminAuth");
const { UPLOAD_PATH } = require("./../config/index.js");

const router = new express.Router();

// Get and Show all Staff
router.get("/", async (req, res) => {
  try {
    const staffs = await Staff.find({});

    return res.status(200).send(staffs);
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

// Find and Get pic attached to a Staff
router.get("/pic/:id", async (req, res) => {
  try {
    const filePath = path.join(
      UPLOAD_PATH,
      "staffs",
      req.params.id,
      "mainPic.png"
    );
    if (fs.existsSync(filePath)) {
      return res.status(200).sendFile(filePath);
    } else {
      return res.status(404).send({ message: "File Not Found" });
    }
  } catch (error) {
    return res.status(400).send({ message: "Internal error" });
  }
});

// Function to add new Staff
router.post("/manage", authenticateAdmin, async (req, res) => {
  console.log("Here!!");
  try {
    if (!checkPermission(req.admin, "addStaff", res)) {
      return;
    }

    const validFields = [
      "fullName",
      "fullName_en",
      "responsibility",
      "responsibility_en",
    ];
    const finalBody = {};
    validFields.forEach((field) => {
      finalBody[field] = req.body[field];
    });
    const staff = new Staff(finalBody);
    await staff.save();
    return res.send(staff);
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

// Handle Image of Staffs
const upload = multer({
  limits: {
    fileSize: 10000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error("لطفا یک تصویر را آپلود کنید"));
    }
    cb(undefined, true);
  },
});

// Get Staffs (For Admin)
router.get("/manage", authenticateAdmin, async (req, res) => {
  try {
    if (!checkPermission(req.admin, "getStaff", res)) {
      return res.status(403).end();
    }
    const staffs = await Staff.find({});

    return res.send(staffs);
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

// Get One Staff via its ID
router.get("/manage/:id", authenticateAdmin, async (req, res) => {
  try {
    if (!checkPermission(req.admin, "getStaff", res)) {
      return res.status(403).end();
    }
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).send();
    }
    return res.send({ staff });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

// Edit one Staff's info via its ID
router.patch("/manage/:id", authenticateAdmin, async (req, res) => {
  try {
    if (!checkPermission(req.admin, "editStaff", res)) {
      return res.status(403).end();
    }
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).send();
    }
    const validUpdates = [
      "fullName",
      "fullName_en",
      "responsibility",
      "responsibility_en",
    ];

    const updates = Object.keys(req.body);
    console.log(updates);
    const isValidOperation = validUpdates.every((update) =>
      updates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).send({ error: "Invalid updates" });
    }
    validUpdates.forEach((update) => (staff[update] = req.body[update]));
    await staff.save();
    return res.send(staff);
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

// Delete one Staff via ID
router.delete("/manage/:id", authenticateAdmin, async (req, res) => {
  try {
    if (!checkPermission(req.admin, "deleteStaff", res)) {
      return res.status(403).end();
    }
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).send();
    }
    await Staff.deleteOne(staff);
    return res.status(204).end();
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

// Handling Staff's picture
router.post(
  "/manage/pic/:id",
  authenticateAdmin,
  upload.single("mainPic"),
  async (req, res) => {
    if (!checkPermission(req.admin, "editStaff", res)) {
      return res.status(403).end();
    }
    try {
      const staff = await Teacher.findById(req.params.id);
      if (!staff) {
        return res.status(404).send();
      }

      const filePath = path.join(UPLOAD_PATH, "staffs", req.params.id);
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true }, (err) => {
          if (err) {
            throw new Error(err);
          }
        });
      }

      const image = await Jimp.read(req.file.buffer);

      const imagePath = path.join(filePath, "mainPic.png");
      await image.writeAsync(imagePath); // Returns Promise

      staff.imagePath = imagePath;

      await staff.save();
      return res.status(200).send(staff);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ error: error.message });
    }
  },
  (err, req, res) => {
    res.status(400).send({ error: err.message });
  }
);

// Function to Delete a Picture attached to a Staff
router.delete("/manage/pic/:id", authenticateAdmin, async (req, res) => {
  if (!checkPermission(req.admin, "editStaff", res)) {
    return res.status(403).end();
  }

  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff || !staff.imagePath) {
      return res.status(404).send();
    }
    const filePath = path.join(
      UPLOAD_PATH,
      "staffs",
      req.params.id,
      "mainPic.png"
    );
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log(err);
      }
    });

    staff.imagePath = "";
    await staff.save();

    return res.send(staff);
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
});

module.exports = router;
