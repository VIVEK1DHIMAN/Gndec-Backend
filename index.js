require('dotenv').config();
const express = require('express');
const session = require('express-session');

const mongoose = require('mongoose');
const passport = require('passport');
const logger = require('morgan');
const cors = require('cors');
require('./config/passport')(passport);
// Calling routes
const routes = require('./routes');

const { MONGODB_URI, PORT, BASE_URL } = require('./config/environment');

const app = express();

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true,
})
  .then(() => console.log('DB Connected'));
mongoose.connection.on('error', (err) => console.log(`DB connection error: ${err.message}`));

app.use(logger('dev'));
app.use(session({
  secret: 'vivekvishalyatin',
  resave: false,
  saveUninitialized: true
}));
app.use(express.urlencoded({ extended: false }));
// Use JSON parser for all non-webhook routes
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (_, res) => {
  res.send('HELLO_MESSAGE');
});

// Using routes
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Binary is listening at ${BASE_URL}`);
});
