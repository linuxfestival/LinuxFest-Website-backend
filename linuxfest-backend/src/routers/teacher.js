const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const { baseURL } = require('../utils/consts');
const Teacher = require('../models/Teacher');
const { checkPermission } = require('../utils/utils');
const { authenticateAdmin } = require('../express_middlewares/adminAuth');

const router = new express.Router();
const baseTeacherUrl = baseURL + '/teachers';

router.post(baseTeacherUrl, authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'addTeacher', res)) {
            return;
        }

        const teacher = new Teacher(req.body.teacher);
        await teacher.save();
        res.send(teacher);

    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.get(baseTeacherUrl, authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'getTeacher', res)) {
            return;
        }
        const teachers = await Teacher.find({});

        let result = [];
        for (const teacher of teachers) {
            await teacher.populate('workshops').execPopulate()
            result = result.concat({
                teacher,
                workshops: teacher.workshops
            });
        }

        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.get(baseTeacherUrl + '/manage/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'getTeacher', res)) {
            return;
        }
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            res.status(404).send();
            return;
        }
        await teacher.populate('workshops').execPopulate();

        res.send({ teacher, workshops: teacher.workshops });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
})

router.patch(baseTeacherUrl + '/manage/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'editTeacher', res)) {
            return;
        }
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            res.status(404).send();
            return;
        }

        const validUpdates = ['fullName', 'description'];
        const updates = Object.keys(req.body.teacher);
        const isValidOperation = updates.every((update) => validUpdates.includes(update));

        if (!isValidOperation) {
            res.status(400).send({ error: 'Invalid updates' });
        }
        updates.forEach(update => teacher[update] = req.body.teacher[update]);
        await teacher.save();
        res.send(teacher);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.delete(baseTeacherUrl + '/manage/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'deleteTeacher', res)) {
            return;
        }

        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            res.status(404).send();
            return;
        }

        await Teacher.deleteOne(teacher);

        teacher.save();

        res.send(teacher);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
})


//Upload file endpoint(s)
const upload = multer({
    limits: {
        fileSize: 10000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('لطفا یک تصویر را آپلود کنید'));
        }
        cb(undefined, true);
    }
});

router.post(baseTeacherUrl + '/pic/:id', authenticateAdmin, upload.single('mainPic'), async (req, res) => {
    if (!checkPermission(req.admin, 'editTeacher', res)) {
        return;
    }
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            res.status(404).send();
            return;
        }

        const buffer = await sharp(req.file.buffer).resize({ width: 1280, height: 960 }).png().toBuffer();
        const filePath = path.resolve(path.join("../uploads", process.env.SITE_VERSION, "teachers", req.params.id));
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true }, (err) => {
                if (err) {
                    throw new Error(err);
                }
            });
        }
        fs.writeFileSync(path.join(filePath, "mainPic.png"), buffer, (err) => {
            if (err) {
                throw new Error(err);
            }
        });

        teacher.imagePath = path.join(filePath, "mainPic.png");
        await teacher.save();

        res.send(teacher);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}, (err, req, res) => {
    res.status(400).send({ error: err.message });
});

router.delete(baseTeacherUrl + '/pic/:id', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'editTeacher', res)) {
        return;
    }

    try {
        const teacher = await Teacher.findById(req.params.id);
        
        if (!teacher || !teacher.imagePath) {
            res.status(404).send();
            return;
        }

        fs.unlink(path.resolve(path.join("../uploads", process.env.SITE_VERSION, "teachers", req.params.id, "mainPic.png")), (err) => {
            if (err) {
                console.log(err);
            }
        });

        teacher.imagePath = '';
        await teacher.save();

        res.send(teacher);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

module.exports = router;
