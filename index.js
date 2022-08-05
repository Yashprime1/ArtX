///////////// Initial setting and import ///////////////////////////////

var express = require('express');
var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

//setting the assets directory to use static assets
app.use(express.static('assets'))

// use res.render to load up an ejs view file


////////////////////////  Redirection pages  ////////////////////////

// index page
app.get('/', function(req, res) {
  res.render('pages/index');
});


// buy page
app.get('/buy', function(req, res) {
  res.render('pages/buy');
});

// sell page
app.get('/sell', function(req, res) {
  res.render('pages/sell');
});

// about page
app.get('/about', function(req, res) {
  res.render('pages/about');
});



// index page
app.get('/', function(req, res) {
  res.render('pages/index');
});


// about page
app.get('/about', function(req, res) {
  res.render('pages/about');
});

app.listen(8080);
console.log('Server is listening on port 8080');