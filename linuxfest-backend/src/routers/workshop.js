const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const Jimp = require('jimp');
const mongoose = require('mongoose');

const Workshop = require('../models/Workshop');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const { checkPermission } = require('../utils/utils');
const { authenticateAdmin } = require('../express_middlewares/adminAuth');
const { SITE_VERSION, UPLOAD_PATH } = require('./../config/index.js')


const router = new express.Router();

router.post('/', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'addWorkshop', res)) {
            return;
        }

        const validFields = ["capacity", "title", "price", "isRegOpen", "description", "times", "teachers"];
        const finalBody = {};
        validFields.forEach(field => {
            finalBody[field] = req.body[field];
        });
        const workshop = new Workshop(finalBody);
        for (const obj of workshop.teachers) {
            const id = obj.id;
            const teacher = await Teacher.findById(id);
            if (!teacher) {
                return res.status(404).send("Teacher not found");
            }
            obj.name = teacher.fullName;
        }
        await workshop.save();

        return res.status(201).send(workshop)
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

router.get("/manage", authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'getWorkshop', res)) {
            return;
        }
        const workshops = await Workshop.find({});

        let result = [];
        for (const workshop of workshops) {
            await workshop.populate('participants').execPopulate()
            const count = await workshop.participantsCount;
            result = result.concat({
                workshop,
                participants: workshop.participants,
                participantsCount: count
            });
        }

        return res.send(result);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const workshops = await Workshop.find({});
        return res.send(workshops);
    } catch (err) {
        return res.status(500).send({ err: err.message });
    }
});

router.get('/manage/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'getWorkshop', res)) {
            return;
        }

        const workshop = await Workshop.findById(req.params.id);
        if (!workshop) {
            return res.status(404).send();
        }

        await workshop.populate('participants').execPopulate();
        let teachers = [];
        for (const teacher of workshop.teachers) {
            teachers = teachers.concat(await Teacher.findById(teacher.id));
        }

        const count = await workshop.participantsCount;
        return res.send({ workshop, participants: workshop.participants, teachers, participantsCount: count });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

router.get("/:id", async (req, res) => {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
        return res.status(404).send();
    }
    let teachers = [];
    for (const teacher of workshop.teachers) {
        teachers = teachers.concat(await Teacher.findById(teacher.id));
    }
    return res.send({ workshop, teachers });
})

router.patch('/manage/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'editWorkshop', res)) {
            return;
        }

        const workshop = await Workshop.findById(req.params.id);
        if (!workshop) {
            return res.status(404).send();
        }

        const validUpdates = ['capacity', 'title', 'isRegOpen', 'description', 'teachers', 'price', 'times'];
        const updates = Object.keys(req.body);
        if (!updates.every(element => validUpdates.includes(element))) {
            return res.status(400).send();
        }

        updates.forEach(update => workshop[update] = req.body[update]);
        await workshop.save()
        return res.send(workshop);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

router.delete('/manage/:id', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'deleteWorkshop', res)) {
        return;
    }
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
        return res.status(404).send();
    }
    await workshop.populate('participants').execPopulate();
    for (const participant of workshop.participants) {
        participant.workshops.splice(participant.workshops.indexOf({ workshop: req.params.id }), 1);
        await participant.save();
    }
    await Workshop.deleteOne(workshop);
    return res.status(204).end()
});

router.put('/manage/:workshopId/user/:userId', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'editWorkshop', res)) {
        return;
    }
    try {
        const workshop = await Workshop.findById(req.params.workshopId);
        if (!workshop) {
            return res.status(404).send();
        }
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).send();
        }
        if (workshop.isRegOpen) {
            user.workshops = user.workshops.concat({ workshop: workshop._id });
            await user.save();
            await workshop.save();
        }
        return res.status(200).send();
    } catch (err) {
        return res.status(500).send(err);
    }
});

router.delete('/manage/:workshopId/user/:userId', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'editWorkshop', res)) {
        return;
    }
    try {
        const workshop = await Workshop.findById(req.params.workshopId);
        if (!workshop) {
            return res.status(404).send();
        }
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).send();
        }

        user.workshops = user.workshops.filter(val => {
            return val._id === workshop._id;
        });

        await user.save();
        return res.status(200).send();
    } catch (err) {
        return res.status(500).send(err.message);
    }
});


//Upload file endpoint(s)
const upload = multer({
    limits: {
        fileSize: 10000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('لطفا تصویر آپلود کنید'));
        }
        cb(undefined, true);
    }
});

router.get('/pic/:id',async(req,res)=>{
    try{
        const filePath = path.join(UPLOAD_PATH, "workshops", req.params.id, "mainPic.png")
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

router.get('/pic/:workshop/:id',async(req,res)=>{
    try{
        const filePath = path.join(UPLOAD_PATH, "workshops", req.params.workshop, req.params.id +".png")
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

router.post('/pic/album/:id', authenticateAdmin, upload.array('pictures'), async (req, res) => {
    if (!checkPermission(req.admin, 'editWorkshop', res)) {
        return;
    }

    try {
        const workshop = await Workshop.findById(req.params.id);
        if (!workshop) {
            return res.status(404).send();
        }

        for (const file of req.files) {
            const filePath = path.join(UPLOAD_PATH, "workshops", req.params.id, "album");
            
            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath, { recursive: true }, (err) => {
                    if (err) {
                        throw new Error(err);
                    }
                });
            }

            const picId = new mongoose.Types.ObjectId();

            const image = await Jimp.read(file.buffer).resize(1280, 960)
            
            const imagePath = path.join(filePath, picId.toHexString() + ".png")
            await image.writeAsync(imagePath); // Returns Promise
            
            
            // const buffer = await sharp(file.buffer).resize({ width: 1280, height: 960 }).png().toBuffer();
            // fs.writeFileSync(path.join(filePath, picId.toHexString() + ".png"), buffer, (err) => {
                //     if (err) {
                    //         throw new Error(err);
                    //     }
                    // });

            workshop.album = workshop.album.concat({
                _id: picId,
                albumPicPath: imagePath
            });
        }

        await workshop.save();

        return res.send(workshop);
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
}, (err, req, res) => {
    return res.status(400).send({ error: err.message });
});

router.delete('/pic/album/:id/:picid', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'editWorkshop', res)) {
        return;
    }

    try {
        const workshop = await Workshop.findOne({ _id: req.params.id, 'album._id': req.params.picid });
        if (!workshop) {
            return res.status(404).send();
        }
        const filePath = path.join(UPLOAD_PATH, "workshops", req.params.id, "album", req.params.picid + '.png')
        fs.unlinkSync(filePath, (err) => {
            if (err) {
                throw new Error(err);
            }
        });

        workshop.album = workshop.album.filter((picObj) => {
            return picObj._id.toHexString() !== req.params.picid;
        });
        await workshop.save();

        return res.send(workshop);
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
});

router.post('/pic/:id', authenticateAdmin, upload.single('mainPic'), async (req, res) => {
    if (!checkPermission(req.admin, 'editWorkshop', res)) {
        return;
    }
    try {
        const workshop = await Workshop.findById(req.params.id);
        if (!workshop) {
            return res.status(404).send();
        }

        const filePath = path.join(UPLOAD_PATH, "workshops", req.params.id);
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true }, (err) => {
                if (err) {
                    throw new Error(err);
                }
            });
        }

        // const buffer = await sharp(req.file.buffer).resize({ width: 1280, height: 960 }).png().toBuffer();
        // fs.writeFileSync(path.join(filePath, "mainPic.png"), buffer, (err) => {
        //     if (err) {
        //         throw new Error(err);
        //     }
        // });

        const image = await Jimp.read(req.file.buffer).resize(1280, 960)
        const imagePath = path.join(filePath, "mainPic.png")
        await image.writeAsync(imagePath); // Returns Promise

        workshop.picPath = imagePath;
        await workshop.save();

        return res.send(workshop);
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
}, (err, req, res) => {
    return res.status(400).send({ error: err.message });
});

router.delete('/pic/:id', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'editWorkshop', res)) {
        return;
    }

    try {
        const workshop = await Workshop.findById(req.params.id);
        if (!workshop || !workshop.picPath) {
            return res.status(404).send();
        }
        const filePath = path.join(UPLOAD_PATH, "workshops", req.params.id, "mainPic.png");
        fs.unlink(filePath, (err) => {
            if (err) {
                throw new Error(err);
            }
        });

        workshop.picPath = '';
        await workshop.save();

        return res.send(workshop);

    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

module.exports = router;