const sessionController = require("../../backend/controllers/session.controller");

exports.handler = async function (event) {
  return sessionController.handle(event);
};
