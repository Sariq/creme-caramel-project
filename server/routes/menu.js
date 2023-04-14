const express = require('express');
const router = express.Router();
const {
    paginateData
} = require('../lib/paginate');

router.get("/api/menu", async (req, res, next) => {
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
    const products = await paginateData(
        false,
        req,
        pageNum,
        "products",
        {},
        { productAddedDate: -1 }
      );
      //console.log(categories)
      console.log(products)
      const productsImagesList = [];
      products.data.forEach(product => {
        productsImagesList.push(`https://creme-caramel-images.fra1.cdn.digitaloceanspaces.com/${product.img[0].uri}`)
      });
      const menu = categories.data.map((category)=>{
          const tempCat = {
              ...category,
              products: products.data.filter((product)=> product.categoryId == category._id)
          }
          return tempCat;
      })
      console.log(menu)

    res.status(200).json({menu:menu, productsImagesList: productsImagesList});
});

module.exports = router;