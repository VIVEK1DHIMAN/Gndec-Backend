const mongoose = require('mongoose');

const { Schema } = mongoose;
const bcrypt = require('bcrypt-nodejs');

const UserSchema = new Schema({
  fullName: {
    type: String,
    required: true,
  },
  universityRoll: {
    type: Number,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    $regex: /^[a-zA-Z0-9]+@gndec.ac.in$/i,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    minlength: 2,
    required: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  course: {
    type: String,
    enum: ['b_tech', 'm_tech', 'mba', 'bba', 'bca', 'mca', 'b_arch'],
    required: true,
  },
  branch: {
    type: String,
    enum: ['ee', 'ece', 'me', 'pe', 'cse', 'ce', 'it', 'mba', 'bba', 'bca', 'mca', 'b_arch'],
    required: true,
  },
  year: {
    type: String,
    default: '',
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true,
  },
  jerseyNo: {
    type: Number,
  },
  verificationToken: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  adminLevel: {
    type: Number,
    default: 0,
  },
});

UserSchema.pre('save', function (next) {
  // get access to the user model
  const user = this;
  if (this.isModified('password') || this.isNew) {
    // generate a salt then run callback
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        next(err);
      }
      // hash our password using the salt
      bcrypt.hash(user.password, salt, null, (err, hash) => {
        if (err) {
          next(err);
        }
        // overwrite plain text password with encrypted password
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  return obj;
};

UserSchema.methods.comparePassword = function (passw, cb) {
  bcrypt.compare(passw, this.password, (err, isMatch) => {
    if (err) {
      cb(err);
    } else {
      cb(null, isMatch);
    }
  });
};

module.exports = mongoose.model('User', UserSchema);
