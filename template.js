// Enter your template code here.
const log = require('logToConsole');
const injectScript = require('injectScript');
const window = require('setInWindow');
const readCookie = require('getCookieValues');
const appendPixel = require('sendPixel');
const encodeUriComponent = require('encodeUriComponent');
const getType = require('getType');
const getUrl = require('getUrl');
const version = '1.0.6';
const copyFromWindow = require('copyFromWindow'); 
const existingAwinObject = copyFromWindow('AWIN'); 

function enc(data) {
  data = data || '';
  return encodeUriComponent(data);
}

var AWIN = existingAwinObject || {};
AWIN.Tracking = AWIN.Tracking || {};
AWIN.Tracking.Sale = {};
AWIN.Tracking.Sale.orderRef = enc(data.orderRef);
AWIN.Tracking.Sale.amount = enc(data.amount);
if (data.cg.indexOf(":") != -1) {
    AWIN.Tracking.Sale.parts = enc(data.cg);
} else {
    AWIN.Tracking.Sale.parts = enc(data.cg + ":" + data.amount);
}
AWIN.Tracking.Sale.currency = enc(data.currency);
AWIN.Tracking.Sale.channel = enc(data.channel);
AWIN.Tracking.Sale.voucher = enc(data.voucher);
AWIN.Tracking.Sale.customerAcquisition = enc(data.customerAcquisition);
AWIN.Tracking.Sale.test = enc(data.test);
AWIN.Tracking.Sale.custom = [];
AWIN.Tracking.Sale.custom[0] = "gtmPlugin_" + version;
if (data.custom && getType(data.custom) == "array") {
  var index = 1;
  for (var i = 0; i < data.custom.length; i++) {
    AWIN.Tracking.Sale.custom[index] = enc(data.custom[i]);
    index++;
  }
}
//set testmode to 1 if url is appspot.com
if(getUrl().search('appspot.com') != -1){
  AWIN.Tracking.Sale.test = 1;
}

window('AWIN', AWIN, true);

//zx_products to support mastertag plugin product data
if (typeof data.plt == "object") {
  var zx_products = [];
  for (var i =0;i < data.plt.length; i++) {
    var o = {};
    o.identifier = data.plt[i].id;
    o.quantity = data.plt[i].quantity;
    o.amount = data.plt[i].amount;
    zx_products.push(o);
  }
}
window('zx_products', zx_products, true);

var buildNs = function() {
    //build the URL: 
    var url = "https://www.awin1.com/sread.img?tt=ns&tv=2&merchant=" + enc(data.advertiserId) + "&amount=" + AWIN.Tracking.Sale.amount + "&cr=" + AWIN.Tracking.Sale.currency + "&ref=" + AWIN.Tracking.Sale.orderRef  + "&parts=" + AWIN.Tracking.Sale.parts + "&vc=" + AWIN.Tracking.Sale.voucher + "&customeracquisition=" + AWIN.Tracking.Sale.customerAcquisition + "&t=" + AWIN.Tracking.Sale.test + "&ch=" + AWIN.Tracking.Sale.channel + "&p1=gtmPlugin_" + version;
  
    if (AWIN.Tracking.AdvertiserConsent !== undefined) {
      url += "&cons=" + (AWIN.Tracking.AdvertiserConsent ? "1" : "0");
    }
    return url;
};

const nsUrl = buildNs();
appendPixel(nsUrl);

//PLT

let productId = data.productId;
let productName = data.productName;
let productPrice = data.productPrice;
let productQuantity = data.productQuantity;
let productSku = data.productSku;
let productCg = data.productCg;
let productCategory = data.productCategory;


if (typeof data.plt == "object") {
  for (var i = 0; i < data.plt.length;i++) {
  var plt = "";
  plt += "AW:P|" + data.advertiserId + "|"+ AWIN.Tracking.Sale.orderRef + "|" +
  (data.plt[i][productId] || data.plt[i].id) + "|" +
  (data.plt[i][productName] || data.plt[i].name) + "|" +
  (data.plt[i][productPrice] || data.plt[i].price) + "|" +
  (data.plt[i][productQuantity] || data.plt[i].quantity) + "|" +
  (data.plt[i][productSku] || data.plt[i].sku) + "|" +
  (data.plt[i][productCg] || data.plt[i].cGroup || productCg) + "|" +
  (data.plt[i][productCategory] || data.plt[i].category);
  appendPixel("https://www.awin1.com/basket.php?product_line=" + encodeUriComponent(plt));
  }
}

const url = 'https://www.dwin1.com/' + data.advertiserId + '.js';
injectScript(url,data.gtmOnSuccess(),data.gtmOnFailure());
