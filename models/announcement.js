const mongoose = require('mongoose');

const { Schema } = mongoose;

const AnnouncementSchema = new Schema({
  announcementText: {
    type: String,
    required: true,
  },
  announcementTitle: {
    type: String,
    required: true,
  },
  isHidden: {
    type: Boolean,
    required: true,
  },
  addedAt: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);
