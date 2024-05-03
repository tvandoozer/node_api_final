const data = {
  states: require("../model/statesData.json"),
  setStates: function (data) {
    this.states = data;
  },
};
const verifyStates = require("../middleware/verifyStates");
const State = require("../model/State");

const getAllStates = async (req, res) => {
  let contig = req.query.contig;

  // Query MongoDB to retrieve fun facts for all states
  let funFactsMap = {};
  try {
    const funFacts = await State.find({}, { stateCode: 1, funfacts: 1 });

    // Create a map of state codes to fun facts
    funFacts.forEach((fact) => {
      funFactsMap[fact.stateCode] = fact.funfacts;
    });
  } catch (error) {
    console.error("Error fetching fun facts from MongoDB:", error);
  }

  // Filter states based on contig parameter if provided
  let filteredStates = data.states;
  if (contig && contig.toLowerCase() === "true") {
    filteredStates = filteredStates.filter(
      (state) => state.code !== "AK" && state.code !== "HI"
    );
  } else if (contig && contig.toLowerCase() === "false") {
    filteredStates = filteredStates.filter(
      (state) => state.code === "AK" || state.code === "HI"
    );
  }

  // Attach fun facts to the response for states that have them
  const statesWithFunFacts = filteredStates.map((state) => {
    const funFactsForState = funFactsMap[state.code];
    if (funFactsForState && funFactsForState.length > 0) {
      return {
        ...state,
        funfacts: funFactsForState,
      };
    } else {
      return state; // Return state without funfacts property
    }
  });

  return res.json(statesWithFunFacts);
};

const getFunfact = async (req, res) => {
  verifyStates(req, res, async () => {
    try {
      // Find the specified state in MongoDB
      const state = await State.findOne({ stateCode: req.params.stateCode });
      const stateName = data.states.find(
        (sta) => sta.code === req.params.stateCode
      );

      if (!state || !state.funfacts || state.funfacts.length === 0) {
        return res
          .status(404)
          .json({ message: `No Fun Facts found for ${stateName.state}` });
      }

      // Select a random fun fact from the array
      const randomIndex = Math.floor(Math.random() * state.funfacts.length);
      const randomFunFact = state.funfacts[randomIndex];

      return res.json({ funfact: randomFunFact });
    } catch (error) {
      console.error("Error fetching state data from MongoDB:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
};

const createFunFact = async (req, res) => {
  verifyStates(req, res, async () => {
    // if (!req?.body?.funfacts) {
    //   return res
    //     .status(400)
    //     .json({ message: "State fun facts value required" });
    // }

    // try {
    //   const result = await State.create({
    //     stateCode: req.params.stateCode,
    //     funfacts: req.body.funfacts,
    //   });

    //   res.status(201).json(result);
    // } catch (err) {
    //   console.error(err);
    // }
    try {
      // Verify if "funfacts" property exists in the request body
      if (!req.body || !req.body.funfacts) {
        return res
          .status(400)
          .json({ message: "State fun facts value required" });
      }

      // Verify if "funfacts" value is an array
      if (!Array.isArray(req.body.funfacts)) {
        return res
          .status(400)
          .json({ message: "State fun facts value must be an array" });
      }

      // Find the requested state in MongoDB
      const state = await State.findOne({ stateCode: req.params.stateCode });

      // If state exists, update fun facts or create a new record
      if (state) {
        // If state already has some fun facts, add new fun facts to them
        const updatedFunFacts = [...state.funfacts, ...req.body.funfacts];
        state.funfacts = updatedFunFacts;
        await state.save();

        return res.status(201).json(state);
      } else {
        // If state does not exist, create a new record in MongoDB
        const newState = await State.create({
          stateCode: req.params.stateCode,
          funfacts: req.body.funfacts,
        });

        return res.status(201).json(newState);
      }
    } catch (error) {
      console.error("Error creating fun facts:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
};

const patchFunFact = async (req, res) => {
  verifyStates(req, res, async () => {
    // if (!req?.body?.id) {
    //   return res.status(400).json({ message: "ID parameter is required." });
    // }

    // const state = await State.findOne({ _id: req.body.id }).exec();
    // if (!state) {
    //   return res
    //     .status(204)
    //     .json({ message: `No state matches ID ${req.body.id}.` });
    // }
    // if (req.body?.firstname) state.firstname = req.body.firstname;
    // if (req.body?.lastname) state.lastname = req.body.lastname;
    // const result = await state.save();
    // res.json(result);
    try {
      // Verify if "funfact" and "index" properties exist in the request body
      if (!req.body || !req.body.index) {
        return res
          .status(400)
          .json({ message: "State fun fact index value required" });
      }

      if (!req.body.funfact) {
        return res
          .status(400)
          .json({ message: "State fun fact value required" });
      }

      // Parse the index value to ensure it's a valid number
      const index = parseInt(req.body.index);

      // Validate if index is a valid number and adjust to match zero-indexed array in MongoDB
      if (isNaN(index) || index < 1) {
        return res.status(400).json({
          message: "Invalid index value. Index must be a positive integer.",
        });
      }
      const adjustedIndex = index - 1;

      // Find the specified state in the MongoDB collection
      const state = await State.findOne({ stateCode: req.params.stateCode });
      const stateName = data.states.find(
        (sta) => sta.code === req.params.stateCode
      );

      // Check if the state exists and has fun facts
      if (!state || !state.funfacts || state.funfacts.length === 0) {
        return res.status(404).json({
          message: `No Fun Facts found for ${stateName.state}`,
        });
      }

      // Check if the specified index is within the range of fun facts array
      if (adjustedIndex >= state.funfacts.length) {
        return res.status(404).json({
          message: `No Fun Fact found at that index for ${stateName.state}`,
        });
      }

      // Update the fun fact at the specified index
      state.funfacts[adjustedIndex] = req.body.funfact;

      // Save the updated record
      const result = await state.save();

      // Respond with the result received from the model
      return res.json(result);
    } catch (error) {
      console.error("Error updating fun fact:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
};

const deleteFunFact = async (req, res) => {
  verifyStates(req, res, async () => {
    // if (!req?.body?.id)
    //   return res.status(400).json({ message: "State ID required." });

    // const state = await State.findOne({ _id: req.body.id }).exec();
    // if (!state) {
    //   return res
    //     .status(204)
    //     .json({ message: `No state matches ID ${req.body.id}.` });
    // }
    // const result = await state.deleteOne({ _id: req.body.id }); //{ _id: req.body.id }
    // res.json(result);

    try {
      // Verify if "index" property exists in the request body
      if (!req.body || !req.body.index) {
        return res
          .status(400)
          .json({ message: "State fun fact index value required" });
      }

      // Parse the index value to ensure it's a valid number
      const index = parseInt(req.body.index);

      // Validate if index is a valid number and adjust to match zero-indexed array in MongoDB
      if (isNaN(index) || index < 1) {
        return res.status(400).json({
          message: "Invalid index value. Index must be a positive integer.",
        });
      }
      const adjustedIndex = index - 1;

      // Find the specified state in the MongoDB collection
      const state = await State.findOne({ stateCode: req.params.stateCode });
      const stateName = data.states.find(
        (sta) => sta.code === req.params.stateCode
      );

      // Check if the state exists and has fun facts
      if (!state || !state.funfacts || state.funfacts.length === 0) {
        return res.status(404).json({
          message: `No Fun Facts found for ${stateName.state}`,
        });
      }

      // Check if the specified index is within the range of fun facts array
      if (adjustedIndex >= state.funfacts.length) {
        return res.status(404).json({
          message: `No Fun Fact found at that index for ${stateName.state}`,
        });
      }

      // Remove the fun fact at the specified index from the array
      state.funfacts.splice(adjustedIndex, 1);

      // Save the updated record
      const result = await state.save();

      // Respond with the result received from the model
      return res.json(result);
    } catch (error) {
      console.error("Error deleting fun fact:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
};

const getState = async (req, res) => {
  // console.log(req.params.stateCode);
  verifyStates(req, res, async () => {
    // const state = data.states.find((sta) => sta.code === req.params.stateCode);
    // res.json(state);
    try {
      // Find the requested state in the data
      const state = data.states.find(
        (sta) => sta.code === req.params.stateCode
      );

      if (!state) {
        return res.status(404).json({ message: "State not found" });
      }

      // Find the state in MongoDB to get its fun facts
      const stateFromMongo = await State.findOne({
        stateCode: req.params.stateCode,
      });

      if (
        stateFromMongo &&
        stateFromMongo.funfacts &&
        stateFromMongo.funfacts.length > 0
      ) {
        // If fun facts exist, attach them to the state
        state.funfacts = stateFromMongo.funfacts;
      }

      return res.json(state);
    } catch (error) {
      console.error("Error fetching state data from MongoDB:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
};

const getCapital = async (req, res) => {
  verifyStates(req, res, async () => {
    const state = data.states.find((sta) => sta.code === req.params.stateCode);
    const capital = state.capital_city;
    res.json({ state: state.state, capital: capital });
  });
};

const getNickname = async (req, res) => {
  verifyStates(req, res, async () => {
    const state = data.states.find((sta) => sta.code === req.params.stateCode);
    const nickname = state.nickname;
    res.json({ state: state.state, nickname: nickname });
  });
};

const getPopulation = async (req, res) => {
  verifyStates(req, res, async () => {
    const state = data.states.find((sta) => sta.code === req.params.stateCode);
    const population = state.population.toLocaleString();
    res.json({ state: state.state, population: population });
  });
};

const getAdmission = async (req, res) => {
  verifyStates(req, res, async () => {
    const state = data.states.find((sta) => sta.code === req.params.stateCode);
    const admission = state.admission_date;
    res.json({ state: state.state, admitted: admission });
  });
};

module.exports = {
  getAllStates,
  createFunFact,
  patchFunFact,
  deleteFunFact,
  getState,
  getCapital,
  getNickname,
  getPopulation,
  getAdmission,
  getFunfact,
};
