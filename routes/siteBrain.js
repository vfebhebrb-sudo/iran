const express=require("express");

const router=express.Router();


const {
updateSiteBrain
}
=
require("../services/siteBrainService");



router.post(
"/refresh",
async(req,res)=>{


    await updateSiteBrain();


    res.json({
        ok:true,
        message:"Site brain updated"
    });


});


module.exports=router;