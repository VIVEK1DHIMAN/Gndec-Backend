const express = require('express');

const router = express.Router();

const { isAdminAuth, attachUser } = require('./middleware');

const { generateRoutes } = require('./utils/generateRoutes.js');
const {
  signup, signin, me, verifyEmail, resendVerification, getAllUsers, updateUser, verifyAdmin,
} = require('./controllers/authController.js');
const {
  addEvent, getAllEvents, markAttendance, markResult,
  deleteEvent, addTeamEvent, markSingleAttendance, promoteEvents,
  markUnmarkedAbsent, addSingleEventAdmin,
} = require('./controllers/eventController.js');
const {
  addSport, getAllSports, toggleSport,
} = require('./controllers/sportController.js');
const {
  addAnnouncement, getAllAnnouncements, updateAnnouncement, hideAnnouncement,
} = require('./controllers/announcementController.js');

const authRoutes = [
  {
    method: 'post',
    route: '/signup',
    action: signup,
  },
  {
    method: 'post',
    route: '/signin',
    action: signin,
  },
  {
    method: 'get',
    route: '/me',
    middleware: attachUser,
    action: me,
  },
  {
    method: 'post',
    route: '/user/update',
    middleware: [attachUser, isAdminAuth],
    action: updateUser,
  },
  {
    method: 'post',
    route: '/verify',
    middleware: [attachUser, isAdminAuth],
    action: verifyAdmin,
  },
  {
    method: 'get',
    route: '/verify/:verificationToken',
    action: verifyEmail,
  },
  {
    method: 'get',
    route: '/resend_verification',
    middleware: attachUser,
    action: resendVerification,
  },
  {
    method: 'get',
    route: '/users',
    middleware: [attachUser, isAdminAuth],
    action: getAllUsers,
  },
];

const eventRoutes = [
  {
    method: 'post',
    route: '/event/admin/add',
    middleware: [attachUser, isAdminAuth],
    action: addSingleEventAdmin,
  },
  {
    method: 'post',
    route: '/event/create',
    middleware: attachUser,
    action: addEvent,
  },
  {
    method: 'post',
    route: '/event/attendance/batch',
    middleware: [attachUser, isAdminAuth],
    action: markAttendance,
  },
  {
    method: 'post',
    route: '/event/attendance',
    middleware: [attachUser, isAdminAuth],
    action: markSingleAttendance,
  },
  {
    method: 'post',
    route: '/event/attendance/kill',
    middleware: [attachUser, isAdminAuth],
    action: markUnmarkedAbsent,
  },
  {
    method: 'post',
    route: '/event/result',
    middleware: [attachUser, isAdminAuth],
    action: markResult,
  },
  {
    method: 'post',
    route: '/event/team',
    middleware: [attachUser, isAdminAuth],
    action: addTeamEvent,
  },
  {
    method: 'post',
    route: '/event/promote',
    middleware: [attachUser, isAdminAuth],
    action: promoteEvents,
  },
  {
    method: 'post',
    route: '/event/delete',
    middleware: [attachUser, isAdminAuth],
    action: deleteEvent,
  },
  {
    method: 'get',
    route: '/event/fetchAll',
    middleware: [attachUser, isAdminAuth],
    action: getAllEvents,
  },
];

const sportRoutes = [
  {
    method: 'post',
    route: '/sport/create',
    middleware: [attachUser, isAdminAuth],
    action: addSport,
  },
  {
    method: 'get',
    route: '/sport/fetchAll',
    action: getAllSports,
  },
  {
    method: 'post',
    route: '/sport/toggle',
    middleware: [attachUser, isAdminAuth],
    action: toggleSport,
  },
];

const announcementRoutes = [
  {
    method: 'post',
    route: '/announcement/create',
    middleware: [attachUser, isAdminAuth],
    action: addAnnouncement,
  },
  {
    method: 'put',
    route: '/announcement/update',
    middleware: [attachUser, isAdminAuth],
    action: updateAnnouncement,
  },
  {
    method: 'put',
    route: '/announcement/hide',
    middleware: [attachUser, isAdminAuth],
    action: hideAnnouncement,
  },
  {
    method: 'get',
    route: '/announcement/fetchAll',
    action: getAllAnnouncements,
  },
];

generateRoutes(router, [
  ...authRoutes,
  ...eventRoutes,
  ...sportRoutes,
  ...announcementRoutes,
]);

module.exports = router;
