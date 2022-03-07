const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const Teacher = require('../models/Teacher');
const { checkPermission } = require('../utils/utils');
const { authenticateAdmin } = require('../express_middlewares/adminAuth');
const { SITE_VERSION } = require('./../config/index.js');

const router = new express.Router();

router.post('/', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'addTeacher', res)) {
            return;
        }

        const validFields = ["fullName", "description"];
        const finalBody = {};
        validFields.forEach(field => {
            finalBody[field] = req.body[field];
        });
        const teacher = new Teacher(finalBody);
        await teacher.save();
        res.send(teacher);

    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

router.get('/', authenticateAdmin, async (req, res) => {
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
        res.status(400).send({ error: err.message });
    }
});

router.get('/manage/:id', authenticateAdmin, async (req, res) => {
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
        res.status(400).send({ error: err.message });
    }
})

router.patch('/manage/:id', authenticateAdmin, async (req, res) => {
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
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every((update) => validUpdates.includes(update));

        if (!isValidOperation) {
            res.status(400).send({ error: 'Invalid updates' });
        }
        updates.forEach(update => teacher[update] = req.body[update]);
        await teacher.save();
        res.send(teacher);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

router.delete('/manage/:id', authenticateAdmin, async (req, res) => {
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
        res.status(204).end()
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
})


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


//TODO : Add picture get route

router.get('/pic/:id',async(req,res)=>{
    try{
        if (fs.existsSync(".."+"/uploads/"+SITE_VERSION+"/teachers/"+req.params.id+"/mainPic.png"))
        {
            res.status(200).sendFile(path.join(__dirname, '../..'+ "/uploads/"+SITE_VERSION+"/teachers/"+req.params.id+"/mainPic.png"));
        }
        else
        {
            res.status(404).send({message:"File Not Found"})
        }
    }catch(error){
        res.status(400).send({message:"Internal error"})
    }
})


router.post('/pic/:id', authenticateAdmin, upload.single('mainPic'), async (req, res) => {
    if (!checkPermission(req.admin, 'editTeacher', res)) {
        return;
    }
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            res.status(404).send();
            return;
        }

        const buffer = await sharp(req.file.buffer).png().toBuffer();
        const filePath = path.resolve(path.join("../uploads", `${SITE_VERSION}`, "teachers", req.params.id));
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

        teacher.imagePath = path.join(filePath, "mainPic.png")
        await teacher.save();

        res.status(200).send(teacher);
    } catch (error) {
        console.log(error)
        res.status(500).send({ error: error.message });
    }
}, (err, req, res) => {
    res.status(400).send({ error: err.message });
});

router.delete('/pic/:id', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'editTeacher', res)) {
        return;
    }

    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher || !teacher.imagePath) {
            res.status(404).send();
            return;
        }

        fs.unlink(path.resolve(path.join("../uploads", `${SITE_VERSION}`, "teachers", req.params.id, "mainPic.png")), (err) => {
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
