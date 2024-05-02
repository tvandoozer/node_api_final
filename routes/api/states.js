const express = require("express");
const router = express.Router();
const statesController = require("../../controllers/statesController");
const verifyStates = require("../../middleware/verifyStates");

router.route("/").get(statesController.getAllStates);
// .post(statesController.createState)
// .put(statesController.updateState)
// .delete(statesController.deleteState);

router.route("/:stateCode").get(verifyStates, statesController.getState);
router.route("/:stateCode/capital").get(statesController.getCapital);
router.route("/:stateCode/nickname").get(statesController.getNickname);
router.route("/:stateCode/population").get(statesController.getPopulation);
router.route("/:stateCode/admission").get(statesController.getAdmission);
router.route("/:stateCode/funfact").get(statesController.getFunfact);

router.route("/:stateCode/funfact").post(statesController.createFunFact);
router.route("/:stateCode/funfact").patch(statesController.patchFunFact);
router.route("/:stateCode/funfact").delete(statesController.deleteFunFact);
// maybe add another router.route for other GET mothods
module.exports = router;
