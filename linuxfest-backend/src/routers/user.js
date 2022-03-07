const express = require('express');
const jwt = require('jsonwebtoken');
const { ZARIN, SIGN_TOKEN, FRONTURL} = require('./../config/index.js')
const ZarinpalCheckout = require('zarinpal-checkout');
const zarinpal = ZarinpalCheckout.create(ZARIN, false);
const User = require('../models/User');
const Discount = require('../models/Discount');
const auth = require('../express_middlewares/userAuth');
const Workshop = require('../models/Workshop');
const { checkPermission, sendWelcomeEmail, sendForgetPasswordEmail } = require('../utils/utils');
const { authenticateAdmin } = require('../express_middlewares/adminAuth');
const { response } = require('express');
const router = new express.Router();


router.get('/verifyPayment',async(req,res)=>{
    try{
        zarinpal.PaymentVerification({
            Amount: req.query.amount,
            Authority: req.query.Authority
	    }).then( async(response)=>{
		if (response.status == 101 || response.status == 100) {
            console.log("Verified! Ref ID: " + response.RefID);
            const user = await User.findOne({
                "orderIDs.idNumber": req.query.order_id
            });
            if (!user) {
                res.status(404).send({message:'Order id not found'})
                return;
            }
            else
            {
                //insert workshops
                let order;
                for (const oi of user.orderIDs) {
                    if (oi.idNumber == req.query.order_id) {
                        order = oi;
                        break;
                    }
                }
                for (const workshop of order.workshopId) {
                    user.workshops = user.workshops.concat({ workshop: workshop });
                }

                //insert to orders history
                user.orders = user.orders.concat({ResCode:response.status,Amount:req.query.amount,OrderId:req.query.order_id,Authority:req.query.Authority,WorkshopIds:order.workshopId})


                user.orderIDs.splice(user.orderIDs.indexOf(order), 1);
                try{
                    await user.save();
                    for (const workshop of order.workshopId) {
                        const workshopObj = await Workshop.findById(workshop);
                        await workshopObj.save();
                    }
                    res.status(200).send({message:'OK',order:order})
                } catch(err) {
                    res.status(500).send({message:'Something is wrong',order:order});
                    console.error(JSON.stringify(err));
                    return;
                }
            }
        } else {
            console.log(response);
            res.status(406).send({message:'Failed payment'})
		}
	}).catch(function (err) {
        console.log(err);
        res.status(504).send({message:'Timeout'})
	})
    }catch(err){
        res.status(500).send({message:err})
    }
})


//==================== Unverified Transactions
router.get('/payment/unverifiedtrans',authenticateAdmin,async(req,res)=>{
    if (!checkPermission(req.admin, "editUser", res)) {
        res.status(401).send();
        return;
    }
    console.log("Verifing old payments")
    zarinpal.UnverifiedTransactions().then(response=>{
        if(response.status == 100){
            console.log(response.status)
            res.status(200).send(response.authorities)
        }else{
            console.log(JSON.stringify(response))
        }
    }).catch(err=>{
        console.log(err)
        res.status(400).send(err)
    })
})

async function createUser(req, res) {
    console.log('yes')
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
        console.log(error)
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

        res.status(200).send({message:'Email Sent'});

    } catch (error) {
        res.status(500).send({ error: error.message });
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
        const decodedEmail = jwt.verify(req.params.token, SIGN_TOKEN).email;
        const user = await User.findOne({ email: decodedEmail, 'forgotTokens.forgotToken': req.params.token });
        if (!user) {
            res.status(404).send({message:'User Not Found!'});
            return;
        }
        user.password = req.body.password;
        user.forgotTokens.splice(user.forgotTokens.indexOf(user.forgotTokens.find(x => x.forgotToken === req.params.token)), 1);
        await user.save();
        
        res.status(200).send(user);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

async function userDelete(user, req, res) {
    try {
        await User.deleteOne(user);
        res.status(204).end()
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"Something is wrong with deleting user"});
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
        res.status(404).send({message:"User Not Found"});
    }
    await userDelete(user, req, res);
    res.status(204).end()
});

//======================= Payment =======================\\
async function initPayment(user, workshops,workshopsIds, discountCode, res) {
    return new Promise(async(resolve,reject)=>{
        const rand = Math.floor(Math.random() * parseInt(`${process.env.RANDOM}`));
        const orderId = parseInt(user._id, 16) % rand;
        user.orderIDs = user.orderIDs.concat({ workshopId:workshopsIds, idNumber: orderId });
        await user.save();
        let price = 0;
        workshops.forEach(workshop => {
            price += workshop.price;
        });
        try {
            if (discountCode) {
                const discount = await Discount.findByCode(discountCode,user._id);
                if (!discount) {
                    throw new Error("Discount not found");
                }
                if (discount.count > 0 || discount.count === -1) {
                    if (discount.count > 0) {
                        discount.count--;
                        //TODO : move this part into verifypayment
                        for(var i=0; i<discount.users.length; i++){
                            if(discount.users[i].user.equals(user._id)){
                                discount.users[i].isUsed = true;
                                break;
                            }
                        }
                        await discount.save();
                    }
                    let dontPay = price * ((discount.percentage) / 100)
                    dontPay = Math.floor(dontPay)
                    price -= dontPay;
                }
            }
        } catch (err) {
            console.log(err);
        }
        if (price === 0) {
            try {
                for (const workshop of workshops) {
                    user.workshops = user.workshops.concat({ workshop: workshop._id })
                }
                await user.save();
                for (const workshop of workshops) {
                    await workshop.save();
                }
            } catch (err) {
                console.log(err.message);
                // res.status(400).send(`Error ${err.message}`);
                reject("Error")
            }
            //Delete Here
            // res.send("OK");
            resolve("Paid")
        }
        else{
        //Cast Rial to Toman
        price = price / 10;
        zarinpal.PaymentRequest({
            Amount: price,
            CallbackURL: `${FRONTURL}`+'/payment/result?order_id='+orderId+'&amount='+price,
            Description: 'Buy Workshop'
        }).then(function (response) {
            if (response.status == 100) {
                resolve(response.url);
            }
            else{
                reject("Error")
            }
        }).catch(function (err) {
            // res.status(500).send(err.message);
            reject("Error");
        })
        }
    
    })
}


router.post('/initpayment', auth, async (req, res) => {
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
                let flag = true;
                await workshop.populate('participants').execPopulate();
                if (workshop.participants.length >= workshop.capacity) {
                    workshop.isRegOpen = false;
                    await workshop.save();
                }
                if (!workshop.isRegOpen) {
                    flag = false;
                }
                //Check already in or not
                for (const wsId of req.user.workshops) {
                    if (wsId.workshop == workshopId) {
                        flag = false;
                    }
                }
                if (flag) {
                    workshops = workshops.concat(workshop);
                }
            } catch (err) {
                res.status(500).send({ msg: err.message, err });
            }
        }
    } catch (err) {
        res.status(400).send(err.message);
    }
    if (workshops.length !== 0) {
        const urlToRedirect = await initPayment(req.user, workshops, req.body.workshopIds, req.body.discount, res)
        console.log("\n\n URL == " + JSON.stringify(urlToRedirect) + "\t\t FOR USER == " + req.user._id + "  \t\t WORKSHOPS == "+req.body.workshopIds+"\n\n")
        res.status(200).send(urlToRedirect)
    } else {
        res.status(400).send("No available workshop to register");
    }
})


module.exports = router;