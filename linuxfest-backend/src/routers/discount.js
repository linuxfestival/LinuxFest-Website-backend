const express = require('express');
const Discount = require('../models/Discount');


const router = new express.Router();

router.get('/', async (req, res) => {
    try {
        res.send((await Discount.find({})));
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/', async (req, res) => {
    try {
        const discount = new Discount(req.body);
        await discount.save();
        res.send(discount);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.patch('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
    try {
        const discount = Discount.findById(req.params.id);
        await Discount.deleteOne(discount);
        res.send();
    } catch (err) {
        res.status(500).send(err.message);
    }
});


module.exports = router;