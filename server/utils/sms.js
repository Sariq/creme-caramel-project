const axios = require('axios');
const moment = require("moment");
const cron = require("node-cron");

const apiPath = 'https://api.sms4free.co.il/ApiSMS/SendSMS';
const apiBalance = 'https://api.sms4free.co.il/ApiSMS/AvailableSMS';

sendSMS = async function ( phoneNumber, smsContent, req, db = null) {
  let sms4freeSecret = null;
  if(req){
     sms4freeSecret = await req.app.db.amazonconfigs.findOne({app: "sms4free"});
  }else{
    sms4freeSecret = await db.amazonconfigs.findOne({app: "sms4free"});
  }
  const key = sms4freeSecret.SECRET_KEY;
  const user = sms4freeSecret.USER;
  const pass = sms4freeSecret.PASSWORD;
  const sender = sms4freeSecret.SENDER_NAME;

  const requestObject = {
    key ,
    user,
    pass,
    sender,
    recipient: phoneNumber,
    msg: smsContent
    }
    return axios.post(apiPath, requestObject, { 
        headers: {
          "Content-Type": 'application/json',
        }
     })
    .then(async (response) => {
        if(response.status === 200){
          const data = {
            smsContent: smsContent,
            response: response,
            created: new Date(),
            ipAddress: req.ip,
            isSuccess: true
          };
            await db.smsHistory.insertOne(data);
            console.info('Successfully sent sms');
        }
    })
    .catch(async (err) => {
      const data = {
        smsContent: smsContent,
        error: err,
        created: new Date(),
        ipAddress: req.ip,
        isSuccess: false
      };
        await db.smsHistory.insertOne(data);
        console.log('Error sending sms:', err);
    });
    
};

checkSMSBalance = async function (db) {

  const sms4freeSecret = await db.amazonconfigs.findOne({app: "sms4free"});
  const key = sms4freeSecret.SECRET_KEY;
  const user = sms4freeSecret.USER;
  const pass = sms4freeSecret.PASSWORD;

const requestObject = {
key,
user,
pass,
}

  // const activeTrailSecret = await db.amazonconfigs.findOne({app: "activetrail"});
  // const activeTrailSecretKey = activeTrailSecret.SECRET_KEY;
  // console.log("activeTrailSecretKey", activeTrailSecretKey);
    return axios.post(apiBalance, requestObject, { 
        headers: {
            "Content-Type": 'application/json',
          }
     })
    .then((response) => {
        if(response.status === 200){
            console.info('check sms balance', response);
            if(response.data< 300){
              const smsContent = getSMSBalanceContent(
                response.data
              );
              //smsService.sendSMS(customer.phone, smsContent, req);
              sendSMS("0542454362", smsContent, null, db);
            }
        }
    })
    .catch((err) => {
        console.log('Error sending sms:', err);
    });
}




getOrderRecivedContent = function (customerName, totalAmount, shippingMethod, orderId, lang) {
    const orderIdSplit = orderId.split("-");
    const idPart2 = orderIdSplit[2];
    if(lang == "0"){
      return `مرحبا ${customerName} \u{1F60A} \n ` 
      + `لقد تم استلام الطلبية بنجاح \u{2705} \n`
      + `اخترت ${shippingMethod == "TAKEAWAY" ? "الاستلام من المحل \u{1F6CD}" : "خدمة التوصيل \u{1F6E9}"}. \n `
      + `رقم الطلبية ${idPart2} \n`
      + `مبلغ الطلبية: ${totalAmount}₪ \n`
      + `شكرا على اختيارنا، صحتين وعافية \u{1F60B} \n`
      + `Creme Caramel \n`
    }else{
      return `היי ${customerName} \u{1F60A} \n ` 
      + `ההזמנה התקבלה בהצלחה \u{2705} \n`
      + ` - שיטת איסוף ${shippingMethod == "TAKEAWAY" ? "איסוף עצמי \u{1F6CD}" : "משלוח \u{1F6E9}"} \n `
      + `מספר הזמנה ${idPart2} \n`
      + `תודה שבחרתם בנו, בתאבון \u{1F60B} \n`
      + `מחיר לתשלום: ${totalAmount}₪ \n`
      + `Creme Caramel \n`
    }
}

getOrderTakeawayReadyContent = function (customerName, orderId, lang) {
  const orderIdSplit = orderId.split("-");
  const idPart2 = orderIdSplit[2];
  if(lang == "0"){
    return `مرحبا ${customerName} \u{1F60A} \n ` 
    + `الطلبية جاهزة للاستلام \u{2705} \n`
    + `رقم الطلبية ${idPart2} \n`
    + `Creme Caramel \n`
  }else{
    return `היי ${customerName} \u{1F60A} \n ` 
    + `ההזמנה מוכנה לאיסוף \u{2705} \n`
    + `מספר הזמנה ${idPart2} \n`
    + `Creme Caramel \n`
  }
}

getOrderDeliveryReadyContent = function (customerName, orderId, lang) {
  const orderIdSplit = orderId.split("-");
  const idPart2 = orderIdSplit[2];
  if(lang == "0"){
    return `مرحبا ${customerName} \u{1F60A} \n ` 
    + `الطلبية بطريقها اليك \u{1F6EB} \n`
    + `رقم الطلبية ${idPart2} \n`
    + `Creme Caramel \n`
  }else{
    return `היי ${customerName} \u{1F60A} \n ` 
    + `ההזמנה מוכנה, השליח בדרך אליך \u{1F6EB} \n`
    + `מספר הזמנה ${idPart2} \n`
    + `Creme Caramel \n`
  }

}

getOrderDeliveryCompanyContent = function (customerName, orderId, lang,orderDate) {
  const orderIdSplit = orderId.split("-");
  const idPart2 = orderIdSplit[2];
  return `مرحبا \n ` 
  + `الطلبية جاهزة للاستلام\n`
  + `ساعة الاستلام ${moment(orderDate).format('HH:mm')}\n`
  + `رقم الطلبية ${idPart2} \n`
  + `اسم الزبون ${customerName} \n`
  + `Creme Caramel \n`
}


getVerifyCodeContent = function (verifyCode, lang) {
  if(lang == "0"){
    return `الكود الخاص بك هو: ${verifyCode}`;
  }else{
    return `קוד האימות שלך הוא: ${verifyCode}`;
  }
}

getSMSBalanceContent = function (credits) {
    return `עדכן את חבילת ה סמס, נשארו: ${credits}`;
}

getOrderInvoiceContent = function (invoiceUrl) {
  return `מצורף לינק לחשבונית לצפייה: ${invoiceUrl}`;
}

const smsService = {
    sendSMS: sendSMS,
    getOrderRecivedContent: getOrderRecivedContent,
    getOrderInvoiceContent: getOrderInvoiceContent,
    getVerifyCodeContent: getVerifyCodeContent,
    getOrderTakeawayReadyContent: getOrderTakeawayReadyContent,
    getOrderDeliveryReadyContent: getOrderDeliveryReadyContent,
    getOrderDeliveryCompanyContent: getOrderDeliveryCompanyContent,
    checkSMSBalance: checkSMSBalance,
};
module.exports = smsService;
