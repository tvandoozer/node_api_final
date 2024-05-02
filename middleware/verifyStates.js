const data = require("../model/statesData.json");

const verifyStates = (req, res, next) => {
  const stateAbbreviation = req.params.stateCode.toUpperCase(); // Convert to uppercase
  console.log("verifyStates", req.params.stateCode);
  const stateExists = data.some((state) => state.code === stateAbbreviation);

  if (!stateExists) {
    return res
      .status(400)
      .json({ message: "Invalid state abbreviation parameter" });
  }

  // If the state exists, attach the cleaned state abbreviation to the request object
  req.params.stateCode = stateAbbreviation;

  next();
};

module.exports = verifyStates;
