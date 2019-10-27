const express = require('express');
const validator = require('validator');

const { baseURL } = require('../utils/consts');
const SuperUser = require('../models/SuperUser');
const { checkPermission } = require('../utils/utils');
const {
    authenticateCreateAdmin,
    authenticateAdmin
} = require('../../express_middlewares/adminAuth');


const router = new express.Router();
const baseAdminUrl = baseURL + '/almightyone';


router.post(baseAdminUrl, authenticateCreateAdmin, async (req, res) => {
    try {
        if (req.admin && !checkPermission(req.admin, 'addAdmin', res)) {
            return;
        }
        if (req.admin && !req.body.admin.permissions.every(perm => typeof perm === 'string')) {
            res.status(400).send();
            return;
        }

        req.newAdmin.username = req.body.admin.username;
        req.newAdmin.password = req.body.admin.password;
        if (req.admin) {
            const forbiddenPerms = ['addAdmin', 'editAdmin', 'deleteAdmin', 'getAdmin'];
            const perms = req.body.admin.permissions.filter((element) => {
                return !forbiddenPerms.includes(element);
            });
            req.newAdmin.permissions = perms.map(element => { return { permission: element } });
        }

        await req.newAdmin.save();

        const token = await req.newAdmin.generateAuthToken();

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

router.get(baseAdminUrl + '/admin', authenticateAdmin, async (req, res) => {
    res.send(req.admin);
});

router.get(baseAdminUrl + '/admin/all', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'getAdmin', res)) {
            return;
        }
        const admins = await SuperUser.find({});
        res.send(admins);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.patch(baseAdminUrl + '/admin/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'editAdmin', res)) {
            return;
        }
        const admin = await SuperUser.findById(req.params.id);
        if (!admin) {
            res.status(404).send();
            return;
        }

        const validFields = ['username', 'password', 'permissions'];
        for (const element in req.body.admin) {
            if (!validFields.includes(element)) {
                res.status(400).send();
                return;
            }
        }

        Object.keys(req.body.admin).forEach((update) => {
            if (update === 'permissions') {
                const forbiddenPerms = ['addAdmin', 'editAdmin', 'deleteAdmin', 'getAdmin'];
                const perm = req.body.admin.permissions.filter(element => !forbiddenPerms.includes(element));
                admin.permissions = perm.map(element => { return { permission: element } });
            } else {
                admin[update] = req.body.admin[update];
            }
        });
        await admin.save();

        res.send(admin);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.delete(baseAdminUrl + '/admin/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'deleteAdmin', res)) {
            return;
        }
        const admin = await SuperUser.findById(req.params.id);
        if (!admin) {
            res.status(404).send();
        }
        await SuperUser.deleteOne(admin);
        await admin.save();
        res.send(admin);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

module.exports = router;