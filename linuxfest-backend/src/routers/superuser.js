const express = require('express');

const { baseURL } = require('../utils/consts');
const SuperUser = require('../models/SuperUser');
const Workshop = require('../models/Workshop');
const User = require('../models/User');
const { checkPermission } = require('../utils/utils');
const {
    authenticateCreateAdmin,
    authenticateAdmin
} = require('../express_middlewares/adminAuth');


const router = new express.Router();

router.post('/', authenticateCreateAdmin, async (req, res) => {
    try {
        if (req.admin && !checkPermission(req.admin, 'addAdmin', res)) {
            return;
        }
        if (req.admin && !req.body.admin.permissions.every(perm => typeof perm === 'string')) {
            res.status(400).send();
            return;
        }

        req.newAdmin.username = req.body.username;
        req.newAdmin.password = req.body.password;
        if (req.admin) {
            const forbiddenPerms = ['addAdmin', 'editAdmin', 'deleteAdmin', 'getAdmin'];
            const perms = req.body.permissions.filter((element) => {
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

router.post('/login', async (req, res) => {
    try {
        const admin = await SuperUser.findByCredentials(req.body.username, req.body.password);
        const token = await admin.generateAuthToken();
        res.send({ admin, token });
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

router.post('/logout', authenticateAdmin, async (req, res) => {
    try {
        req.admin.tokens = req.admin.tokens.filter((token) => token.token !== req.token);
        await req.admin.save();

        res.send();
    } catch (err) {
        res.status(500).send();
    }
});

router.post('/logoutall', authenticateAdmin, async (req, res) => {
    try {
        req.admin.tokens = [];
        await req.admin.save();

        res.send();
    } catch (err) {
        res.status(500).send();
    }
});

router.get('/admin', authenticateAdmin, async (req, res) => {
    res.send(req.admin);
});

router.get('/admin/all', authenticateAdmin, async (req, res) => {
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

router.get('/search/user', authenticateAdmin, async (req, res) => {
    try {
        let users;
        if (!Object.keys(req.query).length) {
            return res.send({
                error: 'قسمت جستوجو خالی میباشد'
            });
        }

        const queries = {}
        Object.keys(req.query).filter((v) => v != 'sorted').map(v => { queries[v] = { $regex: new RegExp(req.query[v]) } });

        let pipeline = User.find(queries);
        if (req.query.sorted) {
            let sort = { timestamps: -1 };
            if (req.query.sorted == 'ascending') {
                sort.timestamps = 1;
            }
            pipeline = pipeline.sort(sort);
        }


        users = await pipeline.exec();
        if (!users) {
            res.status(404).send();
        }
        res.send(users);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});
router.get('/search/workshop', authenticateAdmin, async (req, res) => {
    try {
        let workshops;
        if (!Object.keys(req.query).length) {
            return res.send({
                error: 'قسمت جستوجو خالی میباشد'
            });
        }
        const queries = {};
        Object.keys(req.query).filter((v) => v != 'sorted' && v != 'sort').map(v => { queries[v] = { $regex: new RegExp(req.query[v]) } });
        let pipeline = Workshop.find(queries);
        let sortBy = {};
        if (req.query.sort) {
            sortBy[req.query.sort] = -1;
        }
        //console.log(req.query.sort);

        if (req.query.sorted) {
            let sort = { startTime: -1 };
            if (req.query.sorted == 'ascending') {
                sort.startTime = 1;
                if (req.query.sort) {
                    sortBy[req.query.sort] = 1;
                }
            }
            if (!req.query.sort) {
                pipeline = pipeline.sort(sort);

            }
            else {
                pipeline = pipeline.sort(sortBy);
            }

        }

        workshops = await pipeline.exec();
        if (!workshops) {
            res.status(404).send();
        }
        res.send(workshops)

    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});
router.patch('/admin/:id', authenticateAdmin, async (req, res) => {
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
        for (const element in req.body) {
            if (!validFields.includes(element)) {
                res.status(400).send();
                return;
            }
        }

        Object.keys(req.body).forEach((update) => {
            if (update === 'permissions') {
                const forbiddenPerms = ['addAdmin', 'editAdmin', 'deleteAdmin', 'getAdmin'];
                const perm = req.body.permissions.filter(element => !forbiddenPerms.includes(element));
                admin.permissions = perm.map(element => { return { permission: element } });
            } else {
                admin[update] = req.body[update];
            }
        });
        await admin.save();

        res.send(admin);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
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