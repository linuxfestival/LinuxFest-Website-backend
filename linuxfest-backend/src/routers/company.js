const express = require('express');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const Company = require('../models/Company');
const { checkPermission } = require('../utils/utils');
const { authenticateAdmin } = require('../express_middlewares/adminAuth');

const router = new express.Router();

router.post("/", authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'addCompany', res)) {
            return;
        }

        const company = new Company(req.body);
        await company.save();
        res.status(201).send(company);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

router.patch("/manage/insert/:id",authenticateAdmin,async (req, res)=>{
    try {
        if (!checkPermission(req.admin, 'editCompany', res)) {
            return;
        }

        const company = await Company.findById(req.params.id);

        if (!company) {
            res.status(404).send({message:"Company Not Found!"});
            return;
        }

        company.job_opportunities = company.job_opportunities.concat(res.body.job_opportunities)
        try {
            await company.save();
            res.send(company);
            return;
        } catch (err){
            res.status(400).send(err.message);
            return;
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
})

router.get("/", async (req, res) => {
    try {
        const companies = await Company.find();
        res.send(companies);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.patch("/manage/:id",authenticateAdmin, async (req, res)=>{
    try {
        if (!checkPermission(req.admin, 'editCompany', res)) {
            return;
        }

        const company = await Company.findById(req.params.id);

        if (!company) {
            res.status(404).send({message:"Company Not Found!"});
            return;
        }

        const updates = Object.keys(req.body);
        let allowedUpdates = ['name', 'description', 'logo','job_opportunities'];
        updates.forEach((update) => {
            if (allowedUpdates.includes(update)) {
                company[update] = req.body[update];
            }
        });
        try {
            await company.save();
            res.send(company);
            return;
        } catch (err){
            res.status(400).send(err.message);
            return;
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
})

router.delete("/manage/:id",authenticateAdmin, async (req, res)=>{
    try {
        if (!checkPermission(req.admin, 'deleteCompany', res)) {
            return;
        }
        const company = await Company.findById(req.params.id);
        if (!company) {
            res.status(404).send({message:"Company Not Found"});
            return;
        }
        await Company.deleteOne(company);
        res.status(204).end()
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
})


router.get("/find/:id", async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            res.status(404).send({message:"Company Not Found"});
            return;
        }
        res.status(200).send(company);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


router.patch("/find", authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'editCompany', res)) {
            return;
        }
        const name = req.query.name;
        let company;
        if(!name){
            res.status(400).send({message:"Wrong input"})
            return;
        }
        company = await Company.findOne({name})

        if (!company) {
            res.status(404).send({message:"Company Not Found!"});
            return;
        }

        const updates = Object.keys(req.body);
        let allowedUpdates = ['name', 'description', 'logo','job_opportunities'];
        updates.forEach((update) => {
            if (allowedUpdates.includes(update)) {
                company[update] = req.body[update];
            }
        });
        try {
            await company.save();
            res.send(company);
            return;
        } catch (err){
            res.status(400).send(err.message);
            return;
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.delete("/find", authenticateAdmin, async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'deleteCompany', res)) {
            return;
        }
        const name = req.query.name;
        let company;
        if(!name){
            res.status(400).send({message:"Wrong input"})
            return;
        }
        company = await Company.findOne({name})
        if (!company) {
            res.status(404).send({message:"Company Not Found"});
            return;
        }
        await Company.deleteOne(company);
        res.status(204).end()
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});




const upload = multer({
    limits: {
        fileSize: 10000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('لطفا یک تصویر را آپلود کنید'));
        }
        cb(undefined, true);
    }
});


//TODO : Add picture get route

router.get('/pic/:id',async(req,res)=>{
    try{
        if (fs.existsSync(".."+"/uploads/"+process.env.SITE_VERSION+"/companies/"+req.params.id+"/companyLogo.png"))
        {
            res.status(200).sendFile(path.join(__dirname, '../..'+ "/uploads/"+process.env.SITE_VERSION+"/companies/"+req.params.id+"/companyLogo.png"));
        }
        else
        {
            res.status(404).send({message:"File Not Found"})
        }
    }catch(error){
        res.status(400).send({message:"Internal error"})
    }
})

router.post('/pic/:id', authenticateAdmin, upload.single('companyLogo'), async (req, res) => {
    if (!checkPermission(req.admin, 'editCompany', res)) {
        return;
    }
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            res.status(404).send({message:"Company Not Found!"});
            return;
        }

        const buffer = await sharp(req.file.buffer).png().toBuffer();
        const filePath = path.resolve(path.join("../uploads", `${process.env.SITE_VERSION}`, "companies", req.params.id));
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true }, (err) => {
                if (err) {
                    throw new Error(err);
                }
            });
        }
        fs.writeFileSync(path.join(filePath, "companyLogo.png"), buffer, (err) => {
            if (err) {
                throw new Error(err);
            }
        });

        company.logo = path.join(filePath, "companyLogo.png")
        await company.save();

        res.status(200).send(company);
    } catch (error) {
        console.log(error)
        res.status(500).send({ error: error.message });
    }
}, (err, req, res) => {
    res.status(400).send({ error: err.message });
});


router.delete('/pic/:id', authenticateAdmin, async (req, res) => {
    if (!checkPermission(req.admin, 'editCompany', res)) {
        return;
    }

    try {
        const company = await Company.findById(req.params.id);

        if (!company || !company.logo) {
            res.status(404).send({message:"Not Found"});
            return;
        }

        fs.unlink(path.resolve(path.join("../uploads", `${process.env.SITE_VERSION}`, "companies", req.params.id, "companyLogo.png")), (err) => {
            if (err) {
                console.log(err);
            }
        });

        company.logo = '';
        await company.save();

        res.send(company);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});




module.exports = router;