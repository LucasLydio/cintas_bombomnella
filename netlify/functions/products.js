const productsController = require("../../backend/controllers/products.controller");

exports.handler = async function (event) {
  return productsController.handle(event);
};
