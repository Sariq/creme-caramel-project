const express = require("express");
const router = express.Router();

router.post("/api/error-handler/insert-client-error", async (req, res) => {
    const db = req.app.db;
    try {
      const error = req.body.error;
      const stackTrace = req.body.stackTrace;
      const createdDate = req.body.createdDate;
      const customerId = req.body.customerId;
      
      const errorDoc = {
        error,
        stackTrace,
        createdDate,
        customerId
      }
  
      await db.clientError.insertOne(errorDoc);
      return res.status(200).json({ message: "error successfully inserted" });
    } catch (ex) {
      console.info("Failed to insert the error", ex);
      return res.status(400).json({ message: "Failed to insert the error" });
    }
});

module.exports = router;
