const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const mongoose = require('mongoose');

const Workshop = require('../models/Workshop');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const { checkPermission } = require('../utils/utils');
const { authenticateAdmin } = require('../express_middlewares/adminAuth');

const router = new express.Router();

router.post('/', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'addWorkshop', res)) {
            return;
        }

        const workshop = new Workshop(req.body.workshop);
        for (const obj of workshop.teachers) {
            const id = obj.teacher;
            console.log(id);
            const teacher = await Teacher.findById(id);
            obj.name = teacher.fullName
        }
        await workshop.save();

        res.send(workshop)
    } catch (err) {
        res.status(500).send({ error: err.message });
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
            result = result.concat({
                workshop,
                participants: workshop.participants
            });
        }

        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const workshops = await Workshop.find({});
        res.send(workshops);
    } catch (err) {
        res.status(500).send({ err: err.message });
    }
});

router.get('/manage/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'getWorkshop', res)) {
            return;
        }

        const workshop = await Workshop.findById(req.params.id);
        if (!workshop) {
            res.status(404).send();
            return;
        }

        await workshop.populate('participants').execPopulate();

        res.send({ workshop, participants: workshop.participants });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.get("/:id", async (req, res) => {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
        res.status(404).send();
        return;
    }
    res.send(workshop);
})

router.patch('/manage/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'editWorkshop', res)) {
            return;
        }

        const workshop = await Workshop.findById(req.params.id);
        if (!workshop) {
            res.status(404).send();
            return;
        }

        const validUpdates = ['capacity', 'title', 'isRegOpen', 'description', 'teachers', 'price', 'startTime', 'endTime'];
        const updates = Object.keys(req.body.workshop);
        if (!updates.every(element => validUpdates.includes(element))) {
            res.status(400).send();
            return;
        }

        updates.forEach(update => workshop[update] = req.body.workshop[update]);
        await workshop.save()
        res.send(workshop);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.delete('/manage/:id', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'deleteWorkshop', res)) {
        return;
    }

    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
        res.status(404).send();
        return;
    }

    await Workshop.deleteOne(workshop);
    await workshop.save();

    res.send(workshop);
});

router.put('/manage/:workshopId/user/:userId', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'editWorkshop', res)) {
        return;
    }
    try {
        const workshop = await Workshop.findById(req.params.workshopId);
        if (!workshop) {
            res.status(404).send();
            return;
        }
        const user = await User.findById(req.params.userId);
        if (!user) {
            res.status(404).send();
            return;
        }
        console.log(user.workshops);

        user.workshops = user.workshops.concat({ workshop: workshop._id });
        await user.save();
        res.status(200).send();
    } catch (err) {
        res.status(500).send(err);
    }
});

router.delete('/manage/:workshopId/user/:userId', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'editWorkshop', res)) {
        return;
    }
    try {
        const workshop = await Workshop.findById(req.params.workshopId);
        if (!workshop) {
            res.status(404).send();
            return;
        }
        const user = await User.findById(req.params.userId);
        if (!user) {
            res.status(404).send();
            return;
        }
        console.log(user.workshops);

        user.workshops = user.workshops.filter(val => {
            return val._id === workshop._id;
        });

        await user.save();
        res.status(200).send();
    } catch (err) {
        res.status(500).send(err.message);
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

router.post('/pic/album/:id', authenticateAdmin, upload.array('pictures'), async (req, res) => {
    if (!checkPermission(req.admin, 'editWorkshop', res)) {
        return;
    }

    try {
        const workshop = await Workshop.findById(req.params.id);
        if (!workshop) {
            res.status(404).send();
            return;
        }

        for (const file of req.files) {
            const buffer = await sharp(file.buffer).resize({ width: 1280, height: 960 }).png().toBuffer();
            const filePath = path.resolve(path.join("../uploads", process.env.SITE_VERSION, "workshops", req.params.id, "album"));

            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath, { recursive: true }, (err) => {
                    if (err) {
                        throw new Error(err);
                    }
                });
            }

            const picId = new mongoose.Types.ObjectId();
            fs.writeFileSync(path.join(filePath, picId.toHexString() + ".png"), buffer, (err) => {
                if (err) {
                    throw new Error(err);
                }
            });

            workshop.album = workshop.album.concat({
                _id: picId,
                albumPicPath: path.join(filePath, picId.toHexString() + ".png")
            });
        }

        await workshop.save();

        res.send(workshop);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}, (err, req, res) => {
    res.status(400).send({ error: err.message });
});

router.delete('/pic/album/:id/:picid', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'editWorkshop', res)) {
        return;
    }

    try {
        const workshop = await Workshop.findOne({ _id: req.params.id, 'album._id': req.params.picid });
        if (!workshop) {
            res.status(404).send();
            return;
        }

        fs.unlinkSync(path.resolve(path.join("../uploads", process.env.SITE_VERSION, "workshops", req.params.id, "album", req.params.picid + '.png')), (err) => {
            if (err) {
                throw new Error(err);
            }
        });

        workshop.album = workshop.album.filter((picObj) => {
            return picObj._id.toHexString() !== req.params.picid;
        });
        await workshop.save();

        res.send(workshop);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.post('/pic/:id', authenticateAdmin, upload.single('mainPic'), async (req, res) => {
    if (!checkPermission(req.admin, 'editWorkshop', res)) {
        return;
    }
    try {
        const workshop = await Workshop.findById(req.params.id);
        if (!workshop) {
            res.status(404).send();
            return;
        }

        const buffer = await sharp(req.file.buffer).resize({ width: 1280, height: 960 }).png().toBuffer();
        const filePath = path.resolve(path.join("../uploads", process.env.SITE_VERSION, "workshops", req.params.id));
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

        workshop.picPath = path.join(filePath, "mainPic.png");
        await workshop.save();

        res.send(workshop);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}, (err, req, res) => {
    res.status(400).send({ error: err.message });
});

router.delete('/pic/:id', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'editWorkshop', res)) {
        return;
    }

    try {
        const workshop = await Workshop.findById(req.params.id);
        if (!workshop || !workshop.picPath) {
            res.status(404).send();
            return;
        }

        fs.unlink(path.resolve(path.join("../uploads", process.env.SITE_VERSION, "workshops", req.params.id, "mainPic.png")), (err) => {
            if (err) {
                throw new Error(err);
            }
        });

        workshop.picPath = '';
        await workshop.save();

        res.send(workshop);

    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

module.exports = router;