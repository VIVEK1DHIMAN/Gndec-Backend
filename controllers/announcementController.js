const { extend } = require('lodash');
const Announcement = require('../models/announcement');
const { ERROR_TYPES } = require('../config/errorTypes');

const {
  DATA_MISSING,
  ANNOUNCEMENT_CREATED,
  SOMETHING_WENT_WRONG,
  ANNOUNCEMENT_NOT_FOUND,
  ANNOUNCEMENT_UPDATED,
  ANNOUNCEMENT_HIDDEN,
} = ERROR_TYPES;

module.exports = {
  addAnnouncement: async (req, res) => {
    try {
      const { announcementText, announcementTitle } = req.body;
      // console.log(announcementText);
      if (!announcementText.length) {
        res.status(400).json({ message: DATA_MISSING });
      } else {
        const announcement = await Announcement
          .create({
            announcementText, announcementTitle, isHidden: false, addedAt: new Date(),
          });
        if (announcement) {
          res.status(200).json({ message: ANNOUNCEMENT_CREATED, announcement });
        } else {
          res.status(500).json({
            message: `${SOMETHING_WENT_WRONG}inside`,
          });
        }
      }
      // res.status(200).json({ message: 'everything worked' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  updateAnnouncement: async (req, res) => {
    try {
      const { announcementId, announcementText } = req.body;
      const announcementData = await Announcement.findOne({ _id: announcementId });
      if (!announcementData) return res.status(404).json({ message: ANNOUNCEMENT_NOT_FOUND });
      extend(announcementData, { announcementText });

      const updatedAnnouncement = await announcementData.save();
      return res.status(200).json({
        message: ANNOUNCEMENT_UPDATED, updatedAnnouncement,
      });
    } catch (error) {
      return res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  hideAnnouncement: async (req, res) => {
    try {
      const { announcementId } = req.body;
      const announcementData = await Announcement.findOne({ _id: announcementId });
      if (!announcementData) return res.status(404).json({ message: ANNOUNCEMENT_NOT_FOUND });
      extend(announcementData, { isHidden: true });

      const updatedAnnouncement = await announcementData.save();
      return res.status(200).json({
        message: ANNOUNCEMENT_HIDDEN, updatedAnnouncement,
      });
    } catch (error) {
      return res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  getAllAnnouncements: async (req, res) => {
    try {
      const allAnnouncements = await Announcement.find({ isHidden: false });
      res.status(200).json({ allAnnouncements });
    } catch {
      res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
};
