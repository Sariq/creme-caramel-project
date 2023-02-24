const express = require('express');
const router = express.Router();
const {
    paginateData
} = require('../lib/paginate');

router.get("/admin/categories/:page?", async (req, res, next) => {
    let pageNum = 1;
    if (req.params.page) {
      pageNum = req.params.page;
    }
  
    // Get our paginated data
    const categories = await paginateData(
      false,
      req,
      pageNum,
      "categories",
      {},
      {}
    );
    res.status(200).json(categories.data);
});

module.exports = router;