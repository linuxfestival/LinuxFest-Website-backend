const express = require('express');

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
        await workshops.forEach(async workshop => await workshop.populate('participants').execPopulate());
        res.send(workshops);
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

        res.send(workshop);
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

module.exports = router;