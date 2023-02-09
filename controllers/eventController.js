const Event = require('../models/event');
const { ERROR_TYPES } = require('../config/errorTypes');

const {
  DATA_MISSING, EVENT_SUBMITTED, SOMETHING_WENT_WRONG,
} = ERROR_TYPES;

module.exports = {
  addEvent: async (req, res) => {
    try {
      const { user } = req;
      const { sportIds = [] } = req.body;
      if (!sportIds.length) {
        return res.status(400).json({ message: DATA_MISSING });
      }
      const existingEvents = await Event.find({ userId: user.id }).populate('sportId');
      const trackAndField = existingEvents
        .filter((event) => (event.sportId.sportType === 'field' || event.sportId.sportType === 'track'));
      const fieldEventCount = trackAndField.filter((event) => event.sportId.sportType === 'field').length;
      const trackEventCount = trackAndField.filter((event) => event.sportId.sportType === 'track').length;
      const disableOn = (fieldEventCount >= 2 && trackEventCount >= 1)
        || (fieldEventCount >= 1 && trackEventCount >= 2);
      if (disableOn) {
        return res.status(500).json({ message: 'NOT_ALLOWED' });
      }
      const existingEventIds = existingEvents.map(({ sportId }) => `${sportId}`);
      const finalEventIds = sportIds.filter((x) => !existingEventIds.includes(x));
      await Event.insertMany(finalEventIds.map((sportId) => ({ sportId, userId: user.id })));
      const events = await Event.find({ userId: user.id }).populate('sportId');
      if (events) {
        return res.status(200).json({ message: EVENT_SUBMITTED, events });
      }
      return res.status(500).json({ message: SOMETHING_WENT_WRONG });
    } catch (error) {
      return res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  markAttendance: async (req, res) => {
    try {
      const { present = [], absent = [] } = req.body;
      if (!present || !absent) {
        res.status(400).json({ message: DATA_MISSING });
      } else {
        const presentEvents = await Event.updateMany(
          { _id: { $in: present } },
          { $set: { attendance: 'present' } },
          { multi: true },
        );
        const absentEvents = await Event.updateMany(
          { _id: { $in: absent } },
          { $set: { attendance: 'absent', position: 0 } },
          { multi: true },
        );
        // const events = await Event.find({ userId: user.id }).populate('sportId');
        if (presentEvents || absentEvents) {
          res.status(200).json({ message: 'ATTENDANCE_MARKED' });
        } else {
          res.status(500).json({ message: SOMETHING_WENT_WRONG });
        }
      }
    } catch (error) {
      res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  markSingleAttendance: async (req, res) => {
    try {
      const { eventId, attendance } = req.body;
      if (!eventId) {
        res.status(400).json({ message: DATA_MISSING });
      } else {
        const event = await Event.updateOne({ _id: eventId }, { attendance });
        const refreshedEvents = await Event.findOne(
          { _id: eventId },
        ).populate('sportId');
        if (event) {
          res.status(200).json({ message: 'ATTENDANCE_MARKED', event: refreshedEvents });
        } else {
          res.status(500).json({ message: SOMETHING_WENT_WRONG });
        }
      }
    } catch (error) {
      res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  markUnmarkedAbsent: async (req, res) => {
    try {
      const { sportId } = req.body;
      if (!sportId) {
        res.status(400).json({ message: DATA_MISSING });
      } else {
        const event = await Event.updateMany(
          { sportId, attendance: 'not_marked' },
          { $set: { attendance: 'absent' } },
        );
        const refreshedEvents = await Event.find(
          { sportId, attendance: 'absent' },
          { _id: 1 },
        );
        if (event) {
          res.status(200).json({ message: 'ATTENDANCE_MARKED', eventIds: refreshedEvents });
        } else {
          res.status(500).json({ message: SOMETHING_WENT_WRONG });
        }
      }
    } catch (error) {
      res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  markResult: async (req, res) => {
    try {
      const { result } = req.body;
      if (!result.length) {
        res.status(400).json({ message: DATA_MISSING });
      } else {
        const allEventsPositionsPromise = result.map(async (node) => {
          const promise = await Event.updateOne({ _id: node._id }, { position: node.value });
          return promise;
        });
        const resolvedPromise = Promise.all(allEventsPositionsPromise);
        // const events = await Event.find({ userId: user.id }).populate('sportId');
        if (resolvedPromise) {
          res.status(200).json({ message: 'RESULT_MARKED' });
        } else {
          res.status(500).json({ message: SOMETHING_WENT_WRONG });
        }
      }
    } catch (error) {
      res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  markSingleResult: async (req, res) => {
    try {
      const { eventId, position } = req.body;
      if (!eventId) {
        res.status(400).json({ message: DATA_MISSING });
      } else {
        const updatedEvent = await Event.updateOne({ _id: eventId }, { position });
        const upEvent = await Event.find({ _id: eventId }).populate('sportId');
        if (updatedEvent) {
          res.status(200).json({ message: 'RESULT_MARKED', event: upEvent });
        } else {
          res.status(500).json({ message: SOMETHING_WENT_WRONG });
        }
      }
    } catch (error) {
      res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  deleteEvent: async (req, res) => {
    try {
      const { eventIds } = req.body;
      if (!eventIds.length) {
        res.status(400).json({ message: DATA_MISSING });
      } else {
        const deleted = await Event.deleteMany({ _id: { $in: eventIds } });
        if (deleted) {
          res.status(200).json({ message: 'USER_REMOVED_TEAM' });
        } else {
          res.status(500).json({ message: SOMETHING_WENT_WRONG });
        }
      }
    } catch (error) {
      res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  addTeamEvent: async (req, res) => {
    try {
      const { sportId, userIds } = req.body;
      if (!sportId || userIds.length === 0) {
        res.status(400).json({ message: DATA_MISSING });
      } else {
        const existingEventsBySportId = await Event.find({ sportId });
        const filteredUserIds = userIds.filter((x) => !existingEventsBySportId.map(({ userId }) => `${userId}`).includes(x));
        const added = await Event
          .insertMany(filteredUserIds.map((userId) => ({ sportId, userId })));
        const addedEvents = await Event.find({ _id: { $in: added.map(({ _id }) => `${_id}`) } }).populate('sportId');
        if (addedEvents) {
          res.status(200).json({ message: EVENT_SUBMITTED, teamEvents: addedEvents });
        } else {
          res.status(500).json({
            message: SOMETHING_WENT_WRONG,
          });
        }
      }
    } catch (error) {
      res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  addSingleEventAdmin: async (req, res) => {
    try {
      const { sportId, userId } = req.body;
      if (!sportId || !userId) {
        return res.status(400).json({ message: DATA_MISSING });
      }
      const existingEventsBySportIdandUserId = await Event.findOne({ sportId, userId });
      if (existingEventsBySportIdandUserId) {
        return res.status(400).json({ message: 'EVENT_ALREADY_EXISTS' });
      }
      const added = await Event.insertMany({ sportId, userId });
      const addedEvents = await Event.find({ _id: { $in: added.map(({ _id }) => `${_id}`) } }).populate('sportId');
      if (addedEvents) {
        return res.status(200).json({ message: EVENT_SUBMITTED, events: addedEvents });
      }
      return res.status(500).json({ message: SOMETHING_WENT_WRONG });
    } catch (error) {
      return res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  promoteEvents: async (req, res) => {
    try {
      const { sourceSport, targetSport } = req.body;
      if (!sourceSport || !targetSport) {
        res.status(400).json({ message: DATA_MISSING });
      } else {
        const sourceSportEvents = await Event.find({ sportId: sourceSport, position: 4 });
        const targetSportsEvents = await Event.find({ sportId: targetSport });
        const sourceUserIds = sourceSportEvents.map(({ userId }) => `${userId}`);
        const targetUserIds = targetSportsEvents.map(({ userId }) => `${userId}`);
        const usersIdsToPromote = sourceUserIds.filter((x) => !targetUserIds.includes(x));
        const added = await Event
          .insertMany(usersIdsToPromote.map((userId) => ({ sportId: targetSport, userId })));
        const addedEvents = await Event.find({ _id: { $in: added.map(({ _id }) => `${_id}`) } }).populate('sportId');
        if (addedEvents) {
          res.status(200).json({ message: EVENT_SUBMITTED, promotedEvents: addedEvents });
        } else {
          res.status(500).json({ message: SOMETHING_WENT_WRONG });
        }
      }
    } catch (error) {
      res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  getAllEvents: async (req, res) => {
    try {
      const allEvents = await Event.find().populate('sportId');
      res.status(200).json({ allEvents });
    } catch {
      res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
};
