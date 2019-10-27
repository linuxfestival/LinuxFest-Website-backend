const SuperUser = require('../src/models/SuperUser');
const jwt = require('jsonwebtoken');

async function authenticateCreateAdmin(req, res, next) {
    try {
        console.log("Number of admins: ", (await SuperUser.find()).length);
        const superManPermissions = [
            { permission: "getUser" },
            { permission: "addUser" },
            { permission: "editUser" },
            { permission: "deleteUser" },
            { permission: "getWorkshop" },
            { permission: "addWorkshop" },
            { permission: "editWorkshop" },
            { permission: "deleteWorkshop" },
            { permission: "getTeacher" },
            { permission: "addTeacher" },
            { permission: "editTeacher" },
            { permission: "deleteTeacher" },
            { permission: "getAdmin" },
            { permission: "addAdmin" },
            { permission: "editAdmin" },
            { permission: "deleteAdmin" }
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
                const admin = new SuperUser({
                    permissions: req.body.admin.permissions
                });
                req.newAdmin = admin;

                next();
            });
        }
    } catch (err) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
}

async function authCheckAdmin(req) {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await SuperUser.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!admin) {
            return false;
        }

        // eslint-disable-next-line require-atomic-updates
        req.token = token;
        // eslint-disable-next-line require-atomic-updates
        req.admin = admin;

        return true;
    } catch (err) {
        return false;
    }
}

async function authenticateAdmin(req, res, next) {
    if (await authCheckAdmin(req)) {
        next();
    } else {
        res.status(401).send({ error: 'Please authenticate as admin' });
    }
}

module.exports = {
    authenticateCreateAdmin,
    authenticateAdmin,
};