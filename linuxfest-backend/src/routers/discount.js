const express = require('express');


const Discount = require('../models/Discount');

const { checkPermission } = require('../utils/utils');
const { authenticateAdmin } = require('../express_middlewares/adminAuth');



const router = new express.Router();

router.get('/', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'getWorkshop', res)) {
        return;
    }
    try {
        res.send((await Discount.find({})));
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'addWorkshop', res)) {
        return;
    }
    try {
        const discount = new Discount(req.body);
        await discount.save();
        res.send(discount);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.patch('/:id', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'editWorkshop', res)) {
        return;
    }
    const updates = Object.keys(req.body);
    const allowedUpdates = ['percentage', 'code', 'count'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: 'invalid updates' });
    }
    try {
        const discount = await Discount.findById(req.params.id);    
        updates.forEach((update) => discount[update] = req.body[update]);
        await discount.save();
        res.send(discount);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

router.delete('/:id', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'deleteWorkshop', res)) {
        return;
    }
    try {
        const discount = Discount.findById(req.params.id);
        await Discount.deleteOne(discount);
        res.send();
    } catch (err) {
        res.status(500).send(err.message);
    }
});


module.exports = router;