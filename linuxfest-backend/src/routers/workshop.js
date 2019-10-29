const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const { baseURL } = require('../utils/consts');
const Workshop = require('../models/Workshop');
const { checkPermission } = require('../utils/utils');
const { authenticateAdmin } = require('../../express_middlewares/adminAuth');

const router = new express.Router();
const baseWorkshopUrl = baseURL + '/workshops';

//Pictures router must be implemented!

router.post(baseWorkshopUrl, authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'addWorkshop', res)) {
            return;
        }

        const workshop = new Workshop(req.body.workshop);
        await workshop.save();

        res.send(workshop)
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.get(baseWorkshopUrl, authenticateAdmin, async (req, res) => {
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

router.get(baseWorkshopUrl + '/manage/:id', authenticateAdmin, async (req, res) => {
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

router.patch(baseWorkshopUrl + '/manage/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'editWorkshop', res)) {
            return;
        }

        const workshop = await Workshop.findById(req.params.id);
        if (!workshop) {
            res.status(404).send();
            return;
        }

        const validUpdates = ['capacity', 'title', 'isRegOpen', 'description', 'teachers'];
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

router.delete(baseWorkshopUrl + '/manage/:id', authenticateAdmin, async (req, res) => {
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

//Upload image endpoints
const upload = multer({
    limits: {
        fileSize: 10000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('لطفا یک عکس را آپلود کنید'))
        }
        cb(undefined, true)
    }

});

router.post(baseWorkshopUrl + '/pic:id', authenticateAdmin, upload.single('pic'), async (req, res) => {
    if (!checkPermission(req.admin, 'editWorkshop', res)) {
        return;
    }
    try {

        const workshop = await Workshop.findById(req.params.id);
        if (!workshop) {
            res.status(404).send();
            return;
        }

        const buffer = await sharp(req.file.buffer).resize({ width: 1980, height: 960 }).png().toBuffer();

        const filePath = path.resolve(path.join("../../uploads", process.env.SITE_VERSION, "workshops", req.params.id));

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
    } catch (err) {
        res.status(500).send({ error: err.message });
    }

}, (err, req, res) => {
    res.status(400).send({ error: err.message });
});

module.exports = router;