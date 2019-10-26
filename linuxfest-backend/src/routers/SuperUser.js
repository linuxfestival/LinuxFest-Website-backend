const express = require('express');
const jwt = require('jsonwebtoken');

const { baseURL } = require('../utils/consts');
const SuperUser = require('../models/SuperUser');
const {
    authenticateCreateAdmin,
    authenticateAdmin
} = require('../../express_middlewares/auth');


const router = new express.Router();
const baseAdminUrl = baseURL + '/almightyone';


router.post(baseAdminUrl, authenticateCreateAdmin, async (req, res) => {
    try {
        req.newAdmin.username = req.body.admin.username;
        req.newAdmin.password = req.body.admin.password;
        await req.newAdmin.save();

        token = await req.newAdmin.generateAuthToken();

        res.status(201).send({ admin: req.newAdmin, token });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.post(baseAdminUrl + '/login', async (req, res) => {
    try {
        const admin = await SuperUser.findByCredentials(req.body.username, req.body.password);
        const token = await admin.generateAuthToken();
        res.send({ admin, token });
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

router.get(baseAdminUrl, authenticateAdmin, async (req, res) => {
    res.send(req.admin);
})

module.exports = router;