const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const Teacher = require('../models/Teacher');
const Workshop = require('../models/Workshop');
const { checkPermission } = require('../utils/utils');
const { authenticateAdmin } = require('../express_middlewares/adminAuth');
const { UPLOAD_PATH } = require('./../config/index.js');


const router = new express.Router();

// *************************** Mangement routes ******************** // 

router.post('/manage', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'addTeacher', res)) {
            return;
        }

        const validFields = ["fullName", "fullName_en", "description", "description_en"];
        const finalBody = {};
        validFields.forEach(field => {
            finalBody[field] = req.body[field];
        });
        const teacher = new Teacher(finalBody);
        await teacher.save();
        return res.send(teacher);

    } catch (err) {
        return res.status(400).send({ error: err.message });
    }
});

router.get('/manage', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'getTeacher', res)) {
            return res.status(403).end();
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

        return res.send(result);
    } catch (err) {
        return res.status(400).send({ error: err.message });
    }
});

router.get('/manage/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'getTeacher', res)) {
            return res.status(403).end();
        }
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).send();
        }
        await teacher.populate('workshops').execPopulate();

        return res.send({ teacher, workshops: teacher.workshops });
    } catch (err) {
        return res.status(400).send({ error: err.message });
    }
})

router.patch('/manage/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'editTeacher', res)) {
            return res.status(403).end();
        }
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).send();
        }

        const validUpdates = ['fullName', 'fullName_en', 'description', 'description_en'];
        const updates = Object.keys(req.body);
        const isValidOperation = validUpdates.every((update) => updates.includes(update));

        if (!isValidOperation) {
            return res.status(400).send({ error: 'Invalid updates' });
        }
        validUpdates.forEach(update => teacher[update] = req.body[update]);
        await teacher.save();
        return res.send(teacher);
    } catch (err) {
        return res.status(400).send({ error: err.message });
    }
});

router.delete('/manage/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'deleteTeacher', res)) {
            return res.status(403).end();
        }
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).send();
        }
        await Teacher.deleteOne(teacher);
        return res.status(204).end()
    } catch (err) {
        return res.status(400).send({ error: err.message });
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


router.post('/manage/pic/:id', authenticateAdmin, upload.single('mainPic'), async (req, res) => {
    if (!checkPermission(req.admin, 'editTeacher', res)) {
        return res.status(403).end();
    }
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).send();
        }

        const buffer = await sharp(req.file.buffer).png().toBuffer();
        const filePath = path.join(UPLOAD_PATH, "teachers", req.params.id);
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

        return res.status(200).send(teacher);
    } catch (error) {
        console.log(error)
        return res.status(500).send({ error: error.message });
    }
}, (err, req, res) => {
    res.status(400).send({ error: err.message });
});

router.delete('/manage/pic/:id', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'editTeacher', res)) {
        return res.status(403).end();
    }

    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher || !teacher.imagePath) {
            return res.status(404).send();
        }
        const filePath = path.join(UPLOAD_PATH, "teachers", req.params.id, "mainPic.png");
        fs.unlink(filePath, (err) => {
            if (err) {
                console.log(err);
            }
        });

        teacher.imagePath = '';
        await teacher.save();

        return res.send(teacher);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});


const uploadResume = multer({
    limits: {
        fileSize: 10000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(pdf)$/)) {
            cb(new Error('لطفا فایل پی‌دی‌اف را آپلود نمایید'));
        }
        cb(undefined, true);
    }
});

router.post('/manage/resume/:id', authenticateAdmin, uploadResume.single('mainPic'), async (req, res) => {
    if (!checkPermission(req.admin, 'editTeacher', res)) {
        return res.status(403).end();
    }
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).send();
        }

        const dirPath = path.join(UPLOAD_PATH, "teachers", req.params.id);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true }, (err) => {
                if (err) {
                    throw new Error(err);
                }
            });
        }
        const filePath = path.join(dirPath, "resume.pdf")
        fs.writeFileSync(filePath, req.file.buffer, (err) => {
            if (err) {
                throw new Error(err);
            }
        });

        teacher.resume = filePath
        await teacher.save();

        return res.status(200).send(teacher);
    } catch (error) {
        console.log(error)
        return res.status(500).send({ error: error.message });
    }
}, (err, req, res) => {
    res.status(400).send({ error: err.message });
});


// *********************** ordinary routes ****************** //

router.get('/', async(req,res)=>{
    try {
        const teachers = await Teacher.find({});

        let result = [];
        for (const teacher of teachers) {
            const workshops = await Workshop.find({'teachers.id':{ $in: [teacher.id]}})
            result = result.concat({
                teacher,
                workshops: workshops
            });
        }
        return res.status(200).send(result);
    } catch (err) {
        return res.status(400).send({ error: err.message });
    }
})

router.get('/pic/:id', async(req,res)=>{
    try{
        const filePath = path.join(UPLOAD_PATH, "teachers", req.params.id, "mainPic.png");
        if (fs.existsSync(filePath))
        {
            return res.status(200).sendFile(filePath);
        }
        else
        {
            return res.status(404).send({message:"File Not Found"})
        }
    }catch(error){
        return res.status(400).send({message:"Internal error"})
    }
})


router.get('/resume/:id', async(req,res)=>{
    try{
        const filePath = path.join(UPLOAD_PATH, "teachers", req.params.id, "resume.pdf");
        if (fs.existsSync(filePath))
        {
            return res.status(200).sendFile(filePath);
        }
        else
        {
            return res.status(404).send({message:"File Not Found"})
        }
    }catch(error){
        return res.status(400).send({message:"Internal error"})
    }
})


module.exports = router;
