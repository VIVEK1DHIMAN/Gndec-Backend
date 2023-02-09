const { extend } = require('lodash');
const Sport = require('../models/sport');
const { ERROR_TYPES } = require('../config/errorTypes');

const {
  DATA_MISSING, EVENT_SUBMITTED, SOMETHING_WENT_WRONG,
} = ERROR_TYPES;

module.exports = {
  addSport: async (req, res) => {
    try {
      const {
        sportName, sportType, genderCategory, isActive = true,
      } = req.body;
      if (!sportName || !sportType || !genderCategory) {
        res.status(400).json({ message: DATA_MISSING });
      } else {
        const sport = new Sport();
        extend(sport, {
          sportName, sportType, genderCategory, isActive,
        });
        const sportSaved = await sport.save();
        if (sportSaved) {
          res.status(200).json({ message: EVENT_SUBMITTED, sport: sportSaved });
        } else {
          res.status(500).json({ message: SOMETHING_WENT_WRONG });
        }
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  toggleSport: async (req, res) => {
    try {
      const { sportId, isActive } = req.body;
      if (!sportId) {
        res.status(400).json({ message: DATA_MISSING });
      } else {
        const sportData = await Sport.updateOne({ _id: sportId }, { isActive });
        if (sportData) {
          res.status(200).json({ message: 'SPORT_UPDATED', sportData });
        } else {
          res.status(500).json({ message: SOMETHING_WENT_WRONG });
        }
      }
    } catch (error) {
      res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  getAllSports: async (req, res) => {
    try {
      const allSports = await Sport.find();
      res.status(200).json(allSports);
    } catch {
      res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
};
