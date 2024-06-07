const express = require("express");
const router = express.Router();
const moment = require("moment");
const { getId } = require("../lib/common");
const { paginateData } = require("../lib/paginate");
const websockets = require("../utils/websockets");

function compareVersions(version1, version2) {
  const v1Components = version1.split('.').map(Number);
  const v2Components = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Components.length, v2Components.length); i++) {
      const v1Part = v1Components[i] || 0;
      const v2Part = v2Components[i] || 0;

      if (v1Part > v2Part) {
        return true;  
      } else if (v1Part < v2Part) {
        return false;  
      }
  }
  return true;  
}

router.post("/api/store", async (req, res, next) => {
  let pageNum = 1;
  if (req.params.page) {
    pageNum = req.params.page;
  }

  let stores = await paginateData(false, req, pageNum, "store", {});
  const currentTime = moment(req.body.date).format("HH:mm");
  stores.data = stores.data.map((store) => {
    return {
      ...store,
      isOpen: store.start < currentTime && store.end > currentTime,
    };
  });
  res.status(200).json(stores);
});

router.post("/api/store/update", async (req, res, next) => {
  const db = req.app.db;
  let pageNum = 1;
  if (req.params.page) {
    pageNum = req.params.page;
  }
  let storeDoc = req.body.data;
  const id = storeDoc._id;
  delete storeDoc._id;
  await db.store.updateOne(
    { _id: getId(id) },
    { $set: storeDoc },
    {}
  );
  websockets.fireWebscoketEvent();
  res.status(200).json({ message: "Successfully saved" });
});

router.get("/api/store/download-app", async (req, res) => {
  const db = req.app.db;

  const userAgent = req.get('user-agent');
  console.log("====Download app====", req.headers);
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    const data = {
      source: 'default',
      created: new Date(),
      ipAddress: req.ip,
      type: 'IOS'
    };
    await db.downloadAppQr.insertOne(data);
    res.redirect('itms-apps://itunes.apple.com/app/6446260267');
  } else if (userAgent.includes('Android')) {
    const data = {
      source: 'default',
      created: new Date(),
      ipAddress: req.ip,
      type: 'ANDROID'
    };
    await db.downloadAppQr.insertOne(data);
    res.redirect('https://play.google.com/store/apps/details?id=com.sariq.creme.caramel');
  }
});

router.get("/api/store/is-should-update", async (req, res) => {
  const version = req.headers['app-version'];
  const isValidVersion = compareVersions(version, '1.0.15');
if(!isValidVersion){
   res.status(200).json(true);

}else{
  res.status(200).json(false);
}

});


module.exports = router;
