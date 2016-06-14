var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var jwt = require('jwt-simple');
var bcrypt = require('bcryptjs')
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var nodemailer = require('nodemailer');
var router = express.Router();
var cron = require('node-cron');


// var routes = require('./routes/index');
// var users = require('./routes/users');

mongoose.connect('localhost');


//-----------------START-------------------
//-----------------COMMENTS FOR DB SCHEMAS-------------------

var userSchema = new mongoose.Schema({
  name:String,
  surname:String,
  email: {type:String,unique:true},
  password: String,
  isChecked: Boolean,
  isAccepted: Boolean,
  role: Boolean
});

var leadsSchema = new mongoose.Schema({
  description:String,
  cost: Number,
  category: String,
  manager:String,
  email:String,
  isChecked: Boolean,
  isAccepted: Boolean,
  date: {type: Date, default: Date.now } 
});


//-----------------END-------------------
//-----------------COMMENTS FOR DB SCHEMAS-------------------






//-----------------START-------------------
//-----------------COMMENTS FOR PASSPORT AND SAVE-------------------

userSchema.pre('save', function(next) {
  var user = this;
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};
passport.use(new LocalStrategy({ usernameField: 'email' }, function(email, password, done) {
  User.findOne({ email: email,isChecked:true,isAccepted:true}, function(err, user) {
    if (err) return done(err);
    if (!user) {return done(null, false);
      console.log('Юзера нету');
    }
    user.comparePassword(password, function(err, isMatch) {
      if (err) {
        console.log('Пароль не правильный');
        return done(err);
      }
      if (isMatch) {
        console.log('Получилось');
        return done(null, user);
      }
      return done(null, false);
    });
  });
}));

// ----------------CONVERTING SCHEMES TO MODEL
var User = mongoose.model('User', userSchema);
var Lead = mongoose.model('Lead',leadsSchema);

//-----------------END-------------------
//-----------------COMMENTS FOR PASSPORT AND SAVE-------------------



var app = express();
app.set('port', process.env.PORT || 3000);
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized:true,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));
app.use(passport.initialize());
app.use(passport.session());




//-----------------START-------------------
//-----------------COMMENTS FOR AUTH USER-------------------

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()){
    console.log('Он авторизован');
    next();
}
  else res.send(401,"У тебя есть проблемы");
}

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
app.use(function(req, res, next) {
    if (req.user) {
        res.cookie('user', JSON.stringify(req.user));
    }
    next();
});


//-----------------END-------------------
//-----------------COMMENTS FOR AUTH USER-------------------



// app.use('/', routes);
// app.use('/users', users);




//-----------------START-------------------
//-----------------COMMENTS FOR API-------------------

// POST signup
app.post('/api/signup', function(req, res, next) {
  var user = new User({
    name: req.body.name,
    surname: req.body.surname,
    email: req.body.email,
    password: req.body.password,
    isChecked:false,
    isAccepted: false,
    role:false
  });
  user.save(function(err,data) {
    if (err) return next(err);
    res.send(200,data);
  });
});

//POST login
app.post('/api/login', passport.authenticate('local'), function(req, res) {
  res.cookie('user', JSON.stringify(req.user));
  res.send(req.user);
});

app.post('/api/checkunique',function(req,res,next){
  User.findOne({email:req.body.email},function(err,user){
    if(err) return next(err);
    if(user) res.send(true);
    else res.send(false);
  })
})
app.post('/api/checkis',function(req,res,next){
  User.findOne({email:req.body.email,isChecked:false},function(err,user){
    if(err) return next(err);
    if(user) res.send(true);
    else res.send(false);
  })
})


var smtpTransport = nodemailer.createTransport('SMTP',{
    service : "Gmail",
    auth : {
        user : "nodemailercheck@gmail.com",
        pass : "mgmfwchovxlxhobh"
    }
});

// POST give permission to user
app.post('/api/accept-user', function(req,res){
  var userID = req.body.ID;
  var userEmail = req.body.Email;
  var mailOptions={
    from : "kamalkhan.sdu@gmail.com",
    to : userEmail,
    subject : "Регистрация",
    text : "Ваша заявка на регистрацию принята"
  }
  User.update(
    { _id: userID},
    {$set: {isChecked: true, isAccepted: true}}
  ,function(err,user){
    if(!user){
      return res.send(404);
    }else{
      res.send(200);
      smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
        }else{
            console.log('Sent');
        }
    });
    }
  });
}); 

app.post('/api/decline-user', function(req,res){
  var userID = req.body.ID;
  var userEmail = req.body.Email;
  var mailOptions={
    from : "kamalkhan.sdu@gmail.com",
    to : userEmail,
    subject : "Регистрация",
    text : "Ваша заявка на регистрацию откланена"
  }
  User.update(
    { _id: userID},
    {$set: {isChecked: true, isAccepted: false}}
  ,function(err,user){
    if(!user){
      console.log(userEmail);
      return res.send(404);
    }else{
      res.send(200);
      smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
        }else{
            console.log('Sent');
        }
    });
    }
  });
});


/* STATISTICS START */

app.get('/api/statistic/get-categories',function(req,res){
  Lead.aggregate([
        {
            $group: {
                _id: "$category",
                total: { $sum : 1 }
            }
        }
    ], function (err, result) {
        if (err) {
            next(err);
        } else {
            res.json(result);
            console.log(result);
        }
    });
});

app.get('/api/statistic/get-managers',function(req,res){
  Lead.aggregate([
        {
            $group: {
                _id: "$manager",
                totalCost: { $sum : "$cost" }
            }
        }
    ], function (err, result) {
        if (err) {
            next(err);
        } else {
            res.json(result);
        }
    });
});

app.get('/api/statistic/get-by-day',function(req,res){
  Lead.aggregate([
        {
            $group: {
                _id: { month: { $month: "$date" }, day: { $dayOfMonth: "$date" }, year: { $year: "$date" } },
                totalCost: { $sum : "$cost" }
            }
        }
    ], function (err, result) {
        if (err) {
            next(err);
        } else {
            res.json(result);
            console.log(result);
        }
    });
});

/* STATISTICS END */


// POST give permission to lead
app.post('/api/accept-lead', function(req, res, next){
  var leadID = req.body.ID;
  var leadEmail = req.body.Email;
  var mailOptions={
    from : "kamalkhan.sdu@gmail.com",
    to : leadEmail,
    subject : "Регистрация",
    text : "Ваша заявка принята"
  }
  Lead.findById(leadID, function(err, lead){
    if(err) return next(err);
    lead.isChecked = true; 
    lead.isAccepted = true;
    lead.save(function(err){
      res.status(200).send(lead);
    });
      
    smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
        }else{
            console.log('Sent');
        }
    });
   
  });
});

app.post('/api/decline-lead', function(req,res){
  var leadID = req.body.ID;
  var leadEmail = req.body.Email;
  var mailOptions={
    from : "kamalkhan.sdu@gmail.com",
    to : leadEmail,
    subject : "Регистрация",
    text : "Ваша заявка откланена"
  }
  Lead.update(
    { _id: leadID},
    {$set: {isChecked: true, isAccepted: false}}
  ,function(err,lead){
    if(!lead){
      console.log(leadEmail);
      return res.send(404);
    }else{
      res.send(200);
      smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
        }else{
            console.log('Sent');
        }
    });
    }
  });
});



app.post('/api/add-leads', function(req, res, next){
  var lead = new Lead({
    description: req.body.description,
    cost: req.body.cost,
    category: req.body.category,
    manager: req.body.manager,
    email:req.body.email,
    isChecked: false,
    isAccepted: false,
    date: Date.now()
  });
  lead.save(function(err,lead){
    if(err) {
      console.log(err);
      return next(err);
    }
    res.send(200,lead);
  });
  
});

// POST get-users
app.get('/api/get-users',function(req,res){
  User.find({role:false} , function(err, users){
    if(err){
      return console.log(err);
    }
    res.send(users);
  }).sort({ _id : -1 });
});

app.get('/api/get-leads',function(req,res){
  var nowdate = new Date();
  nowdate.setDate(nowdate.getDate() - 30);
  Lead.find({isChecked: false, date: {$gte: nowdate }} , function(err,leads){
    if(err){
      return console.log(err);
    }
    res.send(leads);
  }).sort({ _id : -1 });
});

app.post('/api/get-users-leads',function(req,res){
  var nowdate = new Date();
  nowdate.setDate(nowdate.getDate() - 30);
  Lead.find({email:req.body.Email,date: {$gte: nowdate }} , function(err,leads){
    if(err){
      return console.log(err);
    }
    res.send(leads);
  }).sort({ _id : -1 });
})

app.post('/api/get-leads-history',function(req,res){
  var nowdate = new Date();
  nowdate.setDate(nowdate.getDate() - 30);
  Lead.find({isChecked: true, date: {$gte: nowdate }} , function(err,leads){
    if(err){
      return console.log(err);
    }
    res.send(leads);
  }).sort({ _id : -1 });
})

app.get('/api/logout', function(req, res, next) {
  req.logout();
  res.send(200);
});

//-----------------COMMENTS FOR API-------------------
//-----------------END-------------------


cron.schedule('0-59 * * * *', function(){
  console.log('running a task every minute');
  var smtpTransport = nodemailer.createTransport('SMTP',{
    service : "Gmail",
    auth : {
        user : "nodemailercheck@gmail.com",
        pass : "mgmfwchovxlxhobh"
    }
  });

  
  Lead.aggregate([
      {
          $group: {
              _id: { month: { $month: "$date" }, day: { $dayOfMonth: "$date" }, year: { $year: "$date" } },
              totalCost: { $sum : "$cost" }
          }
      }
  ], function (err, result,next) {
      if (err) {
          next(err);
      } else {
          var mailOptions={
          from : "kamalkhan.sdu@gmail.com",
          to : "admin@gmail.com",
          subject : "Отсчет за неделю",
          html: "<p> Дата: "+result[0]._id.day +"/"+ result[0]._id.month +"/"+ result[0]._id.year+"</p>"+
          "<p>Общая затрата за неделю: "+result[0].totalCost+" тенге."+"</p>",
          text : "Отсчет за неделю"
        };

        smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
        }else{
            console.log('Sent');
        }
       });
      }
  });

});




// cron.schedule('* * * * *', function(){
//   console.log('running a task every minute');
//   var smtpTransport = nodemailer.createTransport('SMTP',{
//     service : "Gmail",
//     auth : {
//         user : "nodemailercheck@gmail.com",
//         pass : "mgmfwchovxlxhobh"
//     }
// });
//   var sortLeads = {};
//   var nowdate = new Date();
//   nowdate.setDate(nowdate.getDate() - 7);
//   Lead.find({isChecked: true, date: {$gte: nowdate }} , function(err,leads){
//     if(err){
//       return console.log(err);
//     }
//   }).sort({ _id : -1 });
//   var mailOptions={
//     from : "kamalkhan.sdu@gmail.com",
//     to : "duisen.yeldisbayev@gmail.com",
//     subject : "Отсчет за неделю",
//     html:
//     text : "it's just checking, sorry for that,my friend"
//   };
//   smtpTransport.sendMail(mailOptions, function(error, response){
//         if(error){
//             console.log(error);
//         }else{
//             console.log('Sent');
//         }
//     });


// });


//-----------------START-------------------
//-----------------COMMENTS FOR SECURITY-------------------


 app.use('/manager-add', function(req,res,next){
   if(!req.user){
      res.redirect('/');
   }else if(req.user.role){
      res.redirect('/#users-list');
   }else{
      next();
   }
 });
 app.use('/users-leads', function(req,res,next){
   if(!req.user){
      res.redirect('/');
   }else if(req.user.role){
      res.redirect('/#users-list');
   }else{
      next();
   }
 });

 app.use('/statistics',function(req,res,next){
    if(!req.user){
      res.redirect('/');
    }else if(!req.user.role){
      res.redirect('/#users-leads');
    }else{
      next();
    }
 });

  app.use('/leads-history', function(req,res,next){
   if(!req.user){
      res.redirect('/');
   }else if(!req.user.role){
      res.redirect('/#users-leads');
   }else{
      next();
   }
 });
 app.use('/admin-leads', function(req,res,next){
  console.log(req.user);
   if(!req.user){
      res.redirect('/');
   }else if(req.user.role){
      next();
   }else{
      res.redirect('/manager-add');
   }
 });
 app.use('/users-list', function(req,res,next){
   if(!req.user){
      res.redirect('/');
   }else if(!req.user.role){
      res.redirect('/#users-leads');
   }else{
      next();
   }
 });
//-----------------END-------------------
//-----------------COMMENTS FOR SECURITY-------------------









app.get('*', function(req, res) {
  res.redirect('/#' + req.originalUrl);
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.send(500, { message: err.message });
});

var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io')();
io.attach(server);
io.sockets.on('connection',function(socket){

socket.on('join',function(data){
  socket.join(data.email);
})

socket.on('signup', function(data){
  socket.broadcast.emit('admin',{msg:data});
});

socket.on('accept-socket', function(data){
  Lead.find({email:data.old.email}, function(err,response){
    if(err) console.log(err);
    io.sockets.in(data.old.email).emit('adminthird',{msg:data,updateLeads:response});
  });
});

socket.on('decline-socket', function(data){
  Lead.find({email:data.old.email}, function(err,response){
    if(err) console.log(err);
    socket.broadcast.emit('adminfourth',{msg:data,updateLeads:response});
  });
});

socket.on('addleads', function(data){
  socket.broadcast.emit('adminsec',{msg:data});
})
})


module.exports = app;
