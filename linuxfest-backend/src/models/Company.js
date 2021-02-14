const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    logo:{
        type: String   
    },
    job_opportunities:[{
        jobName: {
            type: String,
            required: true
        },
        jobDescription: {
            type: String,
            required: true    
        },
        jlink: {
            type: String,
            required: true    
        }
    }]
}, {
    timestamps: true
});



schema.methods.toJSON = function () {
    const company = this;
    const companyObject = company.toObject();

    const url = `/uploads/${process.env.SITE_VERSION}/companies/${companyObject._id}/companyLogo.png`;
    if (companyObject.logo) {
        delete companyObject.logo;
        companyObject.picUrl = url;
    }
    return companyObject;
};



const Company = new mongoose.model("Company", schema);

module.exports = Company;