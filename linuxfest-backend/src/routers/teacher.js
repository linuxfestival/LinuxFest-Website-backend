const express = require('express');

const { baseURL } = require('../utils/consts');
const Teacher = require('../models/Teacher');
const { checkPermission} = require('../utils/utils');
const { authenticateAdmin} = require('../../express_middlewares');

const router = new express.Router();
const baseTeacherUrl = baseURL + '/teachers';

router.post(baseTeacherUrl, authenticateAdmin, async (req, res) =>{
    try{
        if(!checkPermission(req.admin, 'addTeacher', res)){
            return;
        }

        const teacher = new Teacher(req.body.teacher);
        await teacher.save();
        res.send(teacher);

    }catch(err){
        res.status(500).send({ error: err.message });
    }
});

router.get(baseTeacherUrl, authenticateAdmin, async (req, res) => {
    try{
        if(!checkPermission(req.admin, 'getTeacher', res)){
            return;
        }
        const teachers = await Teacher.find({});
        await teachers.forEach(async teacher => await teacher.populate('workshops').execPopulate());

        res.send(teachers);

    }catch(err){
        res.status(500).send({ error: err.message});
    }
});

router.get(baseTeacherUrl + '/manage/:id', authenticateAdmin, async (req, res) =>{
    try{
        if(!checkPermission(req.admin, 'getTeacher', res)){
            return;
        }
        const teacher = await Teacher.findById(req.params.id);

        if(!teacher){
            res.status(404).send();
            return;
        }
        await teacher.populate('workshops').execPopulate();

        res.send(teacher);
    }catch( err){
        res.status(500).send({ error: err.message});
    }
})

router.patch(baseTeacherUrl + '/manage/:id', authenticateAdmin, async (req, res) =>{
    try{
        if(!checkPermission(req.admin, 'editTeacher', res)){
            return;
        }
        const teacher = await Teacher.findById(req.params.id);

        if(!teacher){
            res.status(404).send();
            return;
        }

        const validUpdates = ['fullName', 'description', 'imagePath'];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every((update) => validUpdates.includes(update));

        if(!isValidOperation){
            res.status(400).send({error: 'Invalid updates'});
        }
        updates.forEach(update => teacher[update] = req.body.workshop[update]);
        await update.save();
        res.send(teacher);
    }catch(err){
        res.status(500).send({ error: err.message });
    }
});

router.delete(baseTeacherUrl, authenticateAdmin, async (req, res) =>{
    try{
        if(!checkPermission(req.admin, 'deleteTeacher', res)){
            return;
        }

        const teacher = await Teacher.findById(req.params.id);

        if(!teacher){
            res.status(404).send();
            return;
        }

        await teacher.deleteOne(teacher);

        teacher.save();

        res.send(teacher);
    }catch(err){
        res.status(500).send({ error: err.message});
    }
})
