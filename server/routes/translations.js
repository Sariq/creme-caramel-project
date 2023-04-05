const express = require('express');
const router = express.Router();
const colors = require("colors");

const {
    paginateData
} = require('../lib/paginate');

const a = {
    "key1": {
        "ar":" aa",
        "he": "bb"
    },
    "key2": {
        "ar":" aa",
        "he": "bb"
    }
}

router.post("/api/admin/translte/add", async (req, res) => {
    const db = req.app.db;
    const translationsJson = req.body;

    try {
        await db.calander.insertOne(calanderObj);
          res.status(200).json(calanderObj);
      } catch (ex) {
        console.error(colors.red("Failed to insert calander disable hour: ", ex));
        res.status(400).json({
          message: "Customer creation failed.",
        });
      }

});

router.post("/api/admin/calander/enable/hour", async (req, res) => {
    const db = req.app.db;
    const calanderObj = {
      date: req.body.date,
      hour: req.body.hour,
    };

    try{
        const updateobj = { isDisabled: false };
        console.log("XXX",updateobj)

        await db.calander.deleteOne({
            date: calanderObj.date, hour: calanderObj.hour });
        return res.status(200).json({ message: 'Disabled Hour enabled successfully updated' });
    }catch(ex){
        console.info('Error updating calander enable hour', ex);
    }

});

router.get("/api/admin/calander/disabled/hours/:date", async (req, res, next) => {
    const db = req.app.db;
    const date = req.params.date;

    const calander = await db.calander
    .find({ date: date })
    // .sort({ created: -1 })
    .toArray();
    res.status(200).json(calander);
});

module.exports = router;