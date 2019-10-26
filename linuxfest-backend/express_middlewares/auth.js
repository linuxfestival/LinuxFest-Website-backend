const express = require('express');
const SuperUser = require('../src/models/SuperUser');
const jwt = require('jsonwebtoken');

async function authenticateCreateAdmin(req, res, next) {
    try {
        console.log((await SuperUser.find()).length);
        const superManPermissions = [
            { permission: "addUser" },
            { permission: "editUser" },
            { permission: "deleteUser" },
            { permission: "addWorkshop" },
            { permission: "editWorkshop" },
            { permission: "deleteWorkshop" },
            { permission: "addTeacher" },
            { permission: "editTeacher" },
            { permission: "deleteTeacher" },
            { permission: "addAdmin" },
            { permission: "editAdmin" },
            { permission: "deleteAdmin" },
            { permission: "getAdmin" }
        ];

        if ((await SuperUser.find()).length === 0) {
            const token = req.header('Authorization').replace('Bearer ', '');

            if (token === process.env.FIRST_ADMIN_SECRET) {
                const admin = new SuperUser({
                    permissions: superManPermissions
                });
                req.newAdmin = admin;
                next();
            } else {
                throw new Error();
            }
        } else {
            await authenticateAdmin(req, res, () => {
                const permissions = req.body.admin.permissions.map((element) => { return { permission: element } }).concat({ permission: "getAdmin" });
                console.log(permissions);

                const admin = new SuperUser({
                    permissions
                });
                req.newAdmin = admin;

                next();
            });
        }
    } catch (err) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
}

async function authenticateAdmin(req, res, next) {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!req.body.operation) {
            req.body.operation = 'getAdmin';
        }
        const admin = await SuperUser.findOne({ _id: decoded._id, 'tokens.token': token, 'permissions.permission': req.body.operation });

        if (!admin) {
            throw new Error();
        }

        req.token = token;
        req.admin = admin;

        next();
    } catch (err) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
}

module.exports = {
    authenticateCreateAdmin,
    authenticateAdmin
};