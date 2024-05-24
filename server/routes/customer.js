const express = require("express");
const router = express.Router();
const colors = require("colors");
const auth = require("./auth");
const smsService = require("../utils/sms");
const { paginateData } = require("../lib/paginate");
const moment = require("moment");

const passport = require("passport");
const authService = require("../utils/auth-service");
const {
  getId,
  clearCustomer,
  sanitize,
} = require("../lib/common");
const rateLimit = require("express-rate-limit");
const { indexCustomers } = require("../lib/indexing");
const { validateJson } = require("../lib/schema");
const { restrict } = require("../lib/auth");

const apiLimiter = rateLimit({
  windowMs: 300000, // 5 minutes
  max: 5,
});

function compareVersions(version1, version2) {
  const v1Components = version1.split('.').map(Number);
  const v2Components = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Components.length, v2Components.length); i++) {
      const v1Part = v1Components[i] || 0;
      const v2Part = v2Components[i] || 0;

      if (v1Part > v2Part) {
        return true;  
        // return `${version1} is greater than ${version2}`;
      } else if (v1Part < v2Part) {
        return false;  

          //return `${version1} is less than ${version2}`;
      }
  }
  return true;  
  //return `${version1} is equal to ${version2}`;
}

router.post("/api/customer/validateAuthCode", async (req, res) => {
  const db = req.app.db;
  const customerObj = {
    phone: req.body.phone,
    authCode: req.body.authCode,
  };
  const customer = await db.customers.findOne({ phone: customerObj.phone });
  if (customer === undefined || customer === null) {
    res.status(400).json({
      message: "A customer with that phone does not exist.",
    });
    return;
  }

  if (
    customer.authCode == customerObj.authCode ||
    // (customerObj.phone === "0542454362" && customerObj.authCode === "1234") ||
    (customerObj.phone === "0528602121" && customerObj.authCode === "1234") ||
    (customerObj.phone === "1234567891" && customerObj.authCode === "1234") ||
    (customerObj.phone === "1234567892" && customerObj.authCode === "1234") ||
    (customerObj.phone === "1234567893" && customerObj.authCode === "1234") ||
    (customerObj.phone === "1234567894" && customerObj.authCode === "1234") ||
    (customerObj.phone === "1234567895" && customerObj.authCode === "1234") ||
    // (customerObj.phone === "0536660444" && customerObj.authCode === "1234") ||
    (customerObj.phone === "1234567899" && customerObj.authCode === "1234")
  ) {
    const customerNewUpdate = {
      ...customer,
      authCode: undefined,
    };

    try {
      authService.toAuthJSON(customerNewUpdate, req).then(async (result) => {
        const updatedCustomer = await db.customers.findOneAndUpdate(
          { _id: getId(customer._id) },
          {
            $set: result,
          },
          { multi: false, returnOriginal: false }
        );

        indexCustomers(req.app).then(() => {
          res
            .status(200)
            .json({ message: "Customer updated", data: updatedCustomer.value });
        });
      });
    } catch (ex) {
      console.error(colors.red(`Failed updating customer: ${ex}`));
      res
        .status(400)
        .json({ message: "Failed to update customer", error_code: -1 });
    }
  } else {
    res.status(200).json({
      err_code: -3,
    });
    return;
  }
});

router.post("/api/customer/create", async (req, res) => {
  const db = req.app.db;
  const random4DigitsCode = Math.floor(1000 + Math.random() * 9000);
  const customerObj = {
    phone: sanitize(req.body.phone),
    authCode: random4DigitsCode,
    created: new Date(),
  };

  // const schemaResult = validateJson("newCustomer", customerObj);
  // if (!schemaResult.result) {
  //   res.status(400).json(schemaResult.errors);
  //   return;
  // }

  const customer = await db.customers.findOne({ phone: req.body.phone });
  if (customer) {
    const updatedCustomer = await db.customers.findOneAndUpdate(
      { phone: req.body.phone },
      {
        $set: { ...customer, authCode: random4DigitsCode, token: null },
      },
      { multi: false, returnOriginal: false }
    );
    if (
      // customer.phone !== "0542454362" &&
      customer.phone !== "0528602121" &&
      customer.phone !== "1234567891" &&
      customer.phone !== "1234567892" &&
      customer.phone !== "1234567893" &&
      customer.phone !== "1234567894" &&
      customer.phone !== "1234567895" &&
     // customer.phone !== "0536660444" &&
      customer.phone !== "1234567899"
    ) {
      const smsContent = smsService.getVerifyCodeContent(random4DigitsCode, req.body?.language);
      await smsService.sendSMS(customer.phone, smsContent, req);
    }
    res.status(200).json({ phone: req.body.phone, isBlocked: customer.isBlocked  });
    return;
  }

  try {
    await db.customers.insertOne(customerObj);
    if (
      // customerObj.phone !== "0542454362" &&
      customerObj.phone !== "0528602121" &&
      customerObj.phone !== "1234567891" &&
      customerObj.phone !== "1234567892" &&
      customerObj.phone !== "1234567893" &&
      customerObj.phone !== "1234567894" &&
      customerObj.phone !== "1234567895" &&
   //   customerObj.phone !== "0536660444" &&
   customerObj.phone !== "1234567899"
    ) {
      const smsContent = smsService.getVerifyCodeContent(random4DigitsCode, req.body?.language);
      await smsService.sendSMS(customerObj.phone, smsContent, req);
    }
    res.status(200).json(customerObj);
  } catch (ex) {
    console.error(colors.red("Failed to insert customer: ", ex));
    res.status(400).json({
      message: "Customer creation failed.",
    });
  }
});

router.post("/api/customer/admin-create", async (req, res) => {
  const db = req.app.db;

  const customerObj = {
    phone: sanitize(req.body.phone),
    created: new Date(),
  };

  const schemaResult = validateJson("newCustomer", customerObj);
  if (!schemaResult.result) {
    res.status(400).json(schemaResult.errors);
    return;
  }

  const customer = await db.customers.findOne({ phone: req.body.phone });
  if (customer) {
    res
      .status(200)
      .json({
        phone: customer.phone,
        fullName: customer.fullName,
        isAdmin: customer.isAdmin,
        customerId: customer._id,
        isBlocked: customer.isBlocked,
        isExist: true,
      });
    return;
  }
  // email is ok to be used.
  try {
    indexCustomers(req.app).then(async () => {
      const newCustomer = await db.customers.insertOne(customerObj);
      const customerInsertedId = newCustomer.insertedId;
      const customer = await db.customers.findOne({
        _id: getId(customerInsertedId),
      });
      res
        .status(200)
        .json({
          phone: customer.phone,
          fullName: customer.fullName,
          isAdmin: customer.isAdmin,
          customerId: customer._id,
        });
    });
  } catch (ex) {
    console.error(colors.red("Failed to insert customer: ", ex));
    res.status(400).json({
      message: "Customer creation failed.",
    });
  }
});

router.post("/api/customer/orders", auth.required, async (req, res) => {
  const customerId = req.auth.id;
  const db = req.app.db;

  try {
    const customer = await db.customers.findOne({
      _id: getId(customerId),
    });
    if (!customer) {
      res.status(400).json({
        message: "Customer not found",
      });
      return;
    }
    if (customer.orders) {
      var ids = customer.orders;

      var oids = [];
      ids.forEach(function (item) {
        oids.push(getId(item));
      });

      const orders = await paginateData(
        true,
        req,
        1,
        "orders",
        {
          _id: { $in: oids },
        },
        { created: -1 }
      );
      res.status(200).json(orders);
    } else {
      res.status(200).json([]);
    }
  } catch (ex) {
    console.error(colors.red(`Failed get customer: ${ex}`));
    res.status(400).json({ message: "Failed to get customer" });
  }
});

router.get("/api/customer/details", auth.required, async (req, res) => {
  const userAgentString = req.headers['user-agent'];
  console.log("====USER AGENT STRING====",userAgentString);
  console.log("====H E A D E R S====",req.headers);
  const regex = /CremeCaramel\/([\d.]+)/;
  const match = userAgentString.match(regex);

  if (match) {
    const version = match[1];
    const isValidVersion = compareVersions(version, '1.0.15');
    if(!isValidVersion){
      return res.status(402).json({ message: "invalid app version" });
    }
  } else {
    console.log('User agent string not found or in unexpected format.');
  }
  const customerId = req.auth.id;
  const db = req.app.db;
  try {
    const customer = await db.customers.findOne({
      _id: getId(customerId),
    });
    if (!customer) {
      res.status(400).json({
        message: "Customer not found",
      });
      return;
    }
    res.status(200).json({
      message: "Customer updated",
      data: {
        phone: customer.phone,
        fullName: customer.fullName,
        isAdmin: customer.isAdmin,
        customerId,
        roles: customer.roles,
      },
    });
  } catch (ex) {
    console.error(colors.red(`Failed get customer: ${ex}`));
    res.status(400).json({ message: "Failed to get customer" });
  }
});

router.post("/api/customer/update-name", auth.required, async (req, res) => {
  const customerId = req.body.customerId || req.auth.id;
  const db = req.app.db;
  const customerObj = {
    fullName: req.body.fullName,
  };

  const customer = await db.customers.findOne({
    _id: getId(customerId),
  });
  if (!customer) {
    res.status(400).json({
      message: "Customer not found",
    });
    return;
  }
  try {
    const updatedCustomer = await db.customers.findOneAndUpdate(
      { _id: getId(customerId) },
      {
        $set: { ...customer, fullName: req.body.fullName },
      },
      { multi: false, returnOriginal: false }
    );
    res.status(200).json({
      message: "Customer updated",
      customer: { fullName: updatedCustomer.value.fullName },
    });
  } catch (ex) {
    console.error(colors.red(`Failed updating customer: ${ex}`));
    res.status(400).json({ message: "Failed to update customer" });
  }
});

// logout the customer
router.post("/api/customer/logout", auth.required, async (req, res) => {
  const db = req.app.db;
  const {
    auth: { id },
  } = req;
  await db.customers.findOneAndUpdate(
    { _id: getId(id) },
    {
      $set: { token: null },
    },
    { multi: false, returnOriginal: false }
  );

  res.status(200).json({ data: "logout success" });
});

router.post("/api/customer/delete", auth.required, async (req, res) => {
  const db = req.app.db;
  const {
    auth: { id },
  } = req;
  await db.customers.deleteOne({ _id: getId(id) });
  res.status(200).json({ data: "blocked success" });
});

// logout the customer
router.get("/customer/logout", (req, res) => {
  // Clear our session
  clearCustomer(req);
  res.redirect("/customer/login");
});

router.post("/api/customer/search-customer", async (req, res) => {
  const db = req.app.db;
  const searchQuery = req.body.searchQuery;
  const query = {
    $or: [
      { phone: { $regex: searchQuery, $options: "i" } }, // Case-insensitive regex search
      { fullName: { $regex: searchQuery, $options: "i" } },
    ],
  };
  const customer = await db.customers.find(query).toArray();

  try {
    res.status(200).json(customer);
  } catch (ex) {
    console.error(colors.red("Failed to search customer: ", ex));
    res.status(400).json({
      message: "Customer search failed.",
    });
  }
});

function relDiff(a, b) {
  let diff =  100 * Math.abs( ( a - b ) / ( (a+b)/2 ) );
  if(a<b){
    diff = diff * -1;
  }
  return diff.toFixed(2);
 }

router.post("/api/customer/new-customers/:page?", async (req, res) => {
  const db = req.app.db;
  let pageNum = 1;
  if (req.body.pageNumber) {
    pageNum = req.body.pageNumber;
  }
  var start = moment().subtract(7, 'days').utcOffset(120);
  start.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

  var end = moment().utcOffset(120);
  end.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
  const filterBy = {
    created: { $gte: new Date(start), $lt: new Date(end) },
  };
  let newCustomers = await paginateData(true, req, pageNum, "customers", filterBy, {
    created: 1,
  });

  var start2 = moment().subtract(14, 'days').utcOffset(120);
  start2.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

  var end2 = moment().subtract(8, 'days').utcOffset(120);
  end2.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
  const filterBy2 = {
    created: { $gte: new Date(start2), $lt: new Date(end2) },
  };
  const prevWeekNewCustomers = await paginateData(true, req, pageNum, "customers", filterBy2, {
    created: 1,
  });
 const percentDeff = relDiff(newCustomers.totalItems, prevWeekNewCustomers.totalItems);
 newCustomers.percentDeff = percentDeff;
  try {
    res.status(200).json(newCustomers);
  } catch (ex) {
    console.error(colors.red("Failed to search customer: ", ex));
    res.status(400).json({
      message: "Customer search failed.",
    });
  }
});

module.exports = router;
