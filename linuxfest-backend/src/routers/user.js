const express = require('express');
const axios = require('axios');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Workshop = require('../models/Workshop');
const auth = require('../express_middlewares/userAuth');

const { initPaymentUrl } = require('../utils/consts');
const { checkPermission, sendWelcomeEmail, sendForgetPasswordEmail } = require('../utils/utils')
const { authenticateAdmin } = require('../express_middlewares/adminAuth')


const router = new express.Router();

async function createUser(req, res) {
    const validFields = ["firstName", "lastName", "email", "password", "phoneNumber", "studentNumber"];
    const finalBody = {};
    validFields.forEach(field => {
        finalBody[field] = req.body[field];
    });
    const user = new User(finalBody);

    try {
        await user.save();

        const token = await user.generateAuthToken();

        sendWelcomeEmail(user);
        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
}

router.post("/", async (req, res) => {
    await createUser(req, res);
});

router.post('/ac', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, "addUser", res)) {
        return;
    }
    await createUser(req, res);
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (error) {
        console.log(error);

        res.status(400).send({ error: error.message });
    }
});

router.post('/me/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
        await req.user.save();

        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.post('/me/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];

        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.get("/", authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, "getUser", res)) {
        return;
    }
    try {
        const users = await User.find();
        res.send(users);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.get("/:id", authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, "getUser", res)) {
        return;
    }
    try {
        const user = await User.findById(req.params.id);
        let workshops = [];
        for (const workshop of user.workshops) {
            workshops = workshops.concat(await Workshop.findById(workshop.workshop));
        }
        res.send({ user, workshops });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.get('/me', auth, async (req, res) => {
    let workshops = [];
    for (const workshop of req.user.workshops) {
        workshops = workshops.concat(await Workshop.findById(workshop.workshop));
    }
    res.send({ user: req.user, workshops });
});

router.post('/forget', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            res.status(404).send();
            return;
        }
        const forgotToken = await user.generateForgotToken(req.body.email);

        sendForgetPasswordEmail(user, forgotToken);

        res.status(200).send();

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

async function userPatch(user, req, res, isAdmin) {
    const updates = Object.keys(req.body);
    let allowedUpdates = ['firstName', 'lastName', 'email', 'password', 'age', 'phoneNumber'];
    if (isAdmin) {
        allowedUpdates += 'studentNumber';
    }
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'invalid updates' });
    }
    try {
        updates.forEach((update) => user[update] = req.body[update]);

        await user.save();

        res.send(user);
    } catch (error) {
        res.status(400).send(error);
    }
}

router.patch('/me', auth, async (req, res) => {
    await userPatch(req.user, req, res, false);
});

router.patch('/:id', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, "editUser", res)) {
        res.status(401).send();
        return;
    }
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404).send();
    }
    await userPatch(user, req, res, true);
});

router.patch('/forget/:token', async (req, res) => {
    try {
        const decodedEmail = jwt.verify(req.params.token, process.env.JWT_SECRET);
        const user = await User.findOne({ email: decodedEmail, 'forgotTokens.forgotToken': req.params.token });
        if (!user) {
            res.status(404).send();
            return;
        }
        user.password = req.body.password;

        await user.save();
        res.status(200).send({ user });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

async function userDelete(user, req, res) {
    try {
        await User.deleteOne(user);
        await user.save();
        res.send(user);
    } catch (error) {
        res.status(500).send();
    }
}

router.delete('/me', auth, async (req, res) => {
    await userDelete(req.user, req, res);
});

router.delete('/:id', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, "deleteUser", res)) {
        res.status(401).send();
        return;
    }
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404).send();
    }
    await userDelete(user, req, res);
});

// Payment

async function initPayment(user, workshops, workshopIds) {
    const rand = Math.floor(Math.random() * parseInt(process.env.RANDOM_MAX));
    const orderId = parseInt(user._id, 16) % rand;
    user.orderIDs = user.orderIDs.concat({ workshopIds, idNumber: orderId });
    await user.save();

    let price = 0;
    workshops.forEach(workshop => {
        price += workshop.price;
    });

    const sign = process.env.TERMINAL_ID + ";" + orderId.toLocaleString('fullwide', { useGrouping: false }) + ";" + price.toLocaleString('fullwide', { useGrouping: false });

    const SignData = CryptoJS.TripleDES.encrypt(sign, CryptoJS.enc.Base64.parse(process.env.TERMINAL_KEY), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    }).toString();
    console.log(SignData);

    const data = {
        MerchantId: process.env.MERCHANT_ID,
        TerminalId: process.env.TERMINAL_ID,
        Amount: price,
        OrderId: orderId,
        LocalDateTime: new Date(),
        ReturnUrl: "http://45.147.76.80/return",
        SignData: SignData,
        PaymentIdentity: process.env.PAYMENT_IDENTITY
    }

    console.log(data);

    const response = await axios.post(initPaymentUrl, data);
    console.log(response.data);
    return response;
}

router.post('/initPayment', auth, async (req, res) => {
    let workshops = [];
    try {
        for (const workshopId of req.body.workshopIds) {
            const workshop = await Workshop.findById(workshopId);
            if (!workshop) {
                res.status(404).send(`${workshopId} not found`);
                return;
            }
            try {
                //Check capacity
                await workshop.populate('participants').execPopulate();
                if (workshop.participants.length >= workshop.capacity) {
                    workshop.isRegOpen = false;
                    await workshop.save();
                }
                if (!workshop.isRegOpen) {
                    res.status(400).send(`Workshop ${workshopId} is full`);
                    return;
                }
                workshops = workshops.concat(workshop);
            } catch (err) {
                res.status(500).send({ msg: err.message, err });
            }

        }
    } catch (err) {
        res.status(400).send();
    }
    try {
        res.send((await initPayment(req.user, workshops, req.body.workshopIds)).data);
    } catch (err) {
        res.status(500).send();
    }
});

module.exports = router;