const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github');
const mongoose = require('mongoose');
const keys = require('../config/keys');

const User = mongoose.model('User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then(user => {
    done(null, user);
  });
});

passport.use(new GitHubStrategy({
      callbackURL: '/auth/github/callback',
      clientID: keys.githubClientID,
      clientSecret: keys.githubClientSecret,
      proxy: true
    },
      async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({ googleId: profile.id });
        if (existingUser) {
          return done(null, existingUser);
        }
        const user = await new User({
          googleId: profile.id,
          displayName: profile.displayName
        }).save();
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
));

// passport.use(new GoogleStrategy({
//     callbackURL: '/auth/google/callback',
//     clientID: keys.googleClientID,
//     clientSecret: keys.googleClientSecret,
//     proxy: true
//   },
//   function (accessToken, refreshToken, profile, done) {
//     User.findOne({ googleId: profile.id }, function (err, user) {
//       if (user) {
//         return done(null, user);
//       }
//
//       const newUser = new User({
//         googleId: profile.id,
//         displayName: profile.displayName
//       });
//       newUser.save(function (err, user) {
//         if (err) {
//           return done(err, null);
//         }
//         return done(null, user);
//       });
//     });
//   }
// ));

// passport.use(
//   new GoogleStrategy(
//     {
//       callbackURL: '/auth/google/callback',
//       clientID: keys.googleClientID,
//       clientSecret: keys.googleClientSecret,
//       proxy: true
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         const existingUser = await User.findOne({ googleId: profile.id });
//         if (existingUser) {
//           return done(null, existingUser);
//         }
//         const user = await new User({
//           googleId: profile.id,
//           displayName: profile.displayName
//         }).save();
//         done(null, user);
//       } catch (err) {
//         done(err, null);
//       }
//     }
//   )
// );
