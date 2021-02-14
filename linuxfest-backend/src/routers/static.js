const express = require('express');

const Static = require('../models/Static');
const { checkPermission } = require('../utils/utils');
const { authenticateAdmin } = require('../express_middlewares/adminAuth');

const router = new express.Router();

router.post("/", authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'addStatic', res)) {
            return;
        }

        const static = new Static(req.body);
        await static.save();
        res.status(201).send(static);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

router.get("/", async (req, res) => {
    try {
        const statics = await Static.find();
        res.send(statics);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get("/find", async (req, res) => {
    try {
        const id = req.query.id;
        const name = req.query.name;
        const type = req.query.type;
        let statics;
        if (id) {
            statics = await Static.findById(id);
        } else if (name) {
            statics = await Static.findOne({ name });
        } else if (type) {
            statics = await Static.find({ type });
        }
        if (!statics) {
            res.status(404).send();
            return;
        }
        res.send(statics);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.patch("/find", authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'editStatic', res)) {
            return;
        }

        const id = req.query.id;
        const name = req.query.name;
        let static;
        if (id) {
            static = await Static.findById(id);
        } else if (name) {
            static = await Static.findOne({ name });
        }
        if (!static) {
            res.status(404).send();
            return;
        }

        const updates = Object.keys(req.body);
        let allowedUpdates = ['name', 'type', 'description'];
        updates.forEach((update) => {
            if (allowedUpdates.includes(update)) {
                static[update] = req.body[update];
            }
        });
        try {
            await static.save();
            res.send(static);
            return;
        } catch (err){
            res.status(400).send(err.message);
            return;
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.delete("/find", authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'deleteStatic', res)) {
            return;
        }

        const id = req.query.id;
        const name = req.query.name;
        let static;
        if (id) {
            static = await Static.findById(id);
        } else if (name) {
            static = await Static.findOne({ name });
        }
        if (!static) {
            res.status(404).send();
            return;
        }

        await Static.deleteOne(static);
        res.send(204).end();
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;