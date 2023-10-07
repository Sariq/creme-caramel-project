const express = require("express");
const router = express.Router();
const moment = require("moment");
const { getId } = require("../lib/common");
const { paginateData } = require("../lib/paginate");
const websockets = require("../utils/websockets");

router.post("/api/store", async (req, res, next) => {
  let pageNum = 1;
  if (req.params.page) {
    pageNum = req.params.page;
  }

  // Get our paginated data

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
  // Get our paginated data

  await db.store.updateOne(
    { _id: getId(id) },
    { $set: storeDoc },
    {}
  );
  websockets.fireWebscoketEvent();

  // Update the index
  res.status(200).json({ message: "Successfully saved" });
});

module.exports = router;
