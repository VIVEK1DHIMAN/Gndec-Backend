const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { extend, max, range } = require('lodash');
const User = require('../models/user');
const Event = require('../models/event');
const { sendMail } = require('../utils/mail');
const { BASE_URL, TOKEN_SECRET } = require('../config/environment');
const { ERROR_TYPES } = require('../config/errorTypes');

const {
  DATA_MISSING, EMAIL_ALREADY_USED, USER_CREATED, EMAIL_SENT, EMAIL_VERIFIED,
  ALREADY_VERIFIED, INCORRECT_PASSWORD, USER_NOT_FOUND, TRY_AGAIN,
  USER_UPDATED, SOMETHING_WENT_WRONG,
} = ERROR_TYPES;

module.exports = {
  signup: async (req, res) => {
    try {
      const {
        email,
        password,
        fullName,
        universityRoll,
        phoneNumber,
        course,
        branch,
        year,
        gender,
      } = req.body;
      console.log(req.body);
      if (!email || !password || !fullName || !universityRoll
        || !phoneNumber || !course || !branch || !gender || !year) {
        return res.status(404).json({ message: DATA_MISSING });
      }
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const sameEmail = await User.findOne({ email });
      const sameURN = await User.findOne({ universityRoll });
      if (sameEmail) {
        return res.status(500).json({ message: EMAIL_ALREADY_USED });
      }
      if (sameURN) {
        return res.status(500).json({ message: 'URN_ALREADY_USED' });
      }
      let jerseyNo = 1;
      const allRegisteredJerseys = (await User.find({})).map((user) => user.jerseyNo);
      let maxJerseyNo;
      if (allRegisteredJerseys.length) {
        maxJerseyNo = max(allRegisteredJerseys);
        jerseyNo = maxJerseyNo + 1;
        const allJerseys = range(1, jerseyNo);
        const unFilledJerseyNumbers = allJerseys.filter((x) => !allRegisteredJerseys.includes(x));
        if (unFilledJerseyNumbers.length) {
          // eslint-disable-next-line prefer-destructuring
          jerseyNo = unFilledJerseyNumbers[0];
        }
      }

      // Add new user
      const newUser = new User({
        email,
        password,
        fullName,
        universityRoll,
        phoneNumber,
        course,
        branch,
        gender,
        year,
        jerseyNo,
        verificationToken,
      });
      const savedUser = await newUser.save();
      if (!savedUser) {
        return res.status(500).json({ message: SOMETHING_WENT_WRONG });
      }
      // send mail
      sendMail({
        to: email,
        subject: 'Verification email for sports meet 2023 (GNDEC)',
        text: `Click here to verify: ${BASE_URL}verify/${verificationToken}`,
      });
      return res.status(200).json({ message: USER_CREATED });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  signin: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: DATA_MISSING });
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: USER_NOT_FOUND });
      }
      // check if password matches
      return user.comparePassword(req.body.password, async (err, isMatch) => {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          const token = jwt.sign(user.toJSON(), TOKEN_SECRET);
          // return the information including token as JSON
          const events = await Event.findOne({ user: user._id });
          if (events && !user.isAdmin) {
            return res.status(200).json({
              token: `JWT ${token}`, events, user,
            });
          }
          return res.status(200).json({ token: `JWT ${token}`, user });
        }
        return res.status(401).json({ message: INCORRECT_PASSWORD });
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
  updateUser: async (req, res) => {
    try {
      const { userId } = req.body;
      const userData = await User.findOne({ _id: userId });
      if (!userData) return res.status(404).json({ message: USER_NOT_FOUND });
      extend(userData, { ...req.body });
      const userUpdated = await userData.save();
      if (!userUpdated) {
        return res.status(500).json({ message: 'USER_NOT_UPDATED' });
      }
      return res.status(200).json({
        message: USER_UPDATED, user: userUpdated,
      });
    } catch (error) {
      return res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },

  me: async (req, res) => {
    try {
      const { user } = req;
      const userData = await User.findOne({ _id: user._id });
      const enrolledEvents = await Event.find({ userId: user._id }).populate('sportId');
      return res.status(200).json({ user: userData, events: enrolledEvents || [] });
    } catch {
      return res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },

  verifyEmail: async (req, res) => {
    try {
      const user = await User.findOne({ verificationToken: req.params.verificationToken });
      if (!user) return res.status(404).json({ message: USER_NOT_FOUND });
      if (user.isVerified) return res.status(200).json({ message: ALREADY_VERIFIED });
      user.isVerified = true;
      const userSaved = await user.save();
      if (!userSaved) return res.status(500).json({ message: TRY_AGAIN });
      return res.status(200).json({ message: EMAIL_VERIFIED });
    } catch {
      return res.status(500).json({ message: TRY_AGAIN });
    }
  },
  verifyAdmin: async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await User.findOne({ _id: userId });
      if (!user) return res.status(404).json({ message: USER_NOT_FOUND });
      user.isVerified = true;
      const userSaved = await user.save();
      if (!userSaved) return res.status(500).json({ message: TRY_AGAIN });
      return res.status(200).json({ message: EMAIL_VERIFIED, user: userSaved });
    } catch {
      return res.status(500).json({ message: TRY_AGAIN });
    }
  },
  resendVerification: async (req, res) => {
    try {
      const { user: { email, verificationToken, isVerified } } = req;
      if (isVerified) {
        return res.status(200).json({ message: ALREADY_VERIFIED });
      }
      sendMail({
        to: email,
        subject: 'Verification email for sports meet (GNDEC)',
        text: `<a href="${BASE_URL}verify/${verificationToken}">${BASE_URL}verify/${verificationToken}</a>`,
      });
      return res.status(200).json({ message: EMAIL_SENT });
    } catch (error) {
      return res.status(500).json({ message: TRY_AGAIN });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await User.find();
      res.status(200).json({ users: users.filter(({ isAdmin }) => !isAdmin) });
    } catch {
      res.status(500).json({ message: SOMETHING_WENT_WRONG });
    }
  },
};
