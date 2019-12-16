const express = require('express');
const User = require('../models/User');
const auth = require('../express_middlewares/userAuth');
const { checkPermision, sendWelcomeEmail, sendForgetPasswordEmail } = require('../utils/utils')
const { authenticateAdmin } = require('../express_middlewares/adminAuth')

//email?

const router = express.Router();

async function createUser(req, res) {
    const user = new User(req.body);

    try {
        await user.save();

        const token = await user.generateAuthToken();

        sendWelcomeEmail(user);
        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
}

router.post('/users', async (req, res) => {
    await createUser(req, res);
});

router.post('/users/ac', authenticateAdmin, async (req, res) => {
    if (!checkPermision(req.admin, "addUser", res)) {
        return;
    }
    await createUser(req, res);
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (error) {
        console.log(error);

        res.status(400).send(error);
    }
});

router.post('/users/me/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
        await req.user.save();

        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.post('/users/me/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];

        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.get('/users/forget', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.user.email });

        if (!user) {
            res.status(404).send();
            return;
        }
        const forgotToken = await user.generateForgotToken(req.body.user.email);

        sendForgetPasswordEmail(user, forgotToken);

        res.status(200).send();

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

async function userPatch(user, req, res, isAdmin) {
    const updates = Object.keys(req.body);
    let allowedUpdates = ['firstName', 'lastName', 'email', 'password', 'age', 'phoneNumber'];
    if(isAdmin){
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

router.patch('/users/me', auth, async (req, res) => {
    await userPatch(req.user, req, res, false);
});

router.patch('/users/:id', authenticateAdmin, async (req, res) => {
    if (!checkPermision(req.admin, "editUser", res)) {
        return;
    }
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404).send();
    }
    await userPatch(user, req, res, true);
});

router.patch('/users/forget/:token', async(req, res) =>{
    try{
        const user = await User.findOne({'forgotTokens.forgotToken': req.params.token});
        if(!user){
            res.status(404).send();
            return;
        }
        user.password = req.body.password

        await user.save();
        res.status(200).send({ user });
    }catch(error){
        res.status(500).send({error: error.message});
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

router.delete('/users/me', auth, async (req, res) => {
    await userDelete(req.user, req, res);
});

router.delete('/users/:id', authenticateAdmin, async (req, res) => {
    if (!checkPermision(req.admin, "deleteUser", res)) {
        return;
    }
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404).send();
    }
    await userDelete(user, req, res);
});

module.exports = router;