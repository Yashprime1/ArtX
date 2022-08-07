///////////// Initial setting and import ///////////////////////////////

var express = require('express');
var app = express();
var multer = require('multer');
var mysql = require('mysql');
var path = require("path")
var AWS = require('aws-sdk');
const dotenv = require("dotenv");
dotenv.config();

//configuring the AWS environment
AWS.config = new AWS.Config();
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});


// Configuring Database Connection
var pool = mysql.createPool({
  connectionLimit : 100,
  host: process.env.AWS_RDS_ENDPOINT,
  user: process.env.AWS_RDS_USER,
  password: process.env.AWS_RDS_PASSWORD,
  port: process.env.AWS_RDS_PORT,
  database: process.env.AWS_RDS_DATABASE
});


// dropping table

// pool.query('DROP TABLE ct_db_devops.arts', function (error, results, fields) {
//   if (error) throw error;
//   console.log('Table dropped');
// });

pool.query('CREATE TABLE IF NOT EXISTS arts(id int NOT NULL AUTO_INCREMENT, artname varchar(100), artistname varchar(100), arturl varchar(300),created_on DATETIME NOT NULL DEFAULT NOW(), PRIMARY KEY(id));', function (error, results, fields) {
  if (error) throw error;
  // console.log('The table created: ', results);
});






var s3 = new AWS.S3();
var formidable = require('formidable');
var fs = require('fs');
const { connect } = require('http2');


// set the view engine to ejs
app.set('view engine', 'ejs');

//setting the assets directory to use static assets
app.use(express.static('assets'))





////////////////////////  Redirection pages  ////////////////////////

// index page
app.get('/', function(req, res) {
  // selecting recent 4 arts to display
  var sql_list = 'select * from ct_db_devops.arts order by created_on DESC limit 4';
  pool.query(sql_list, function (error, results, fds) {
    if (error) throw error;
    if (results){
      // console.log(results);
      res.render('pages/index',{"art_list":results});
    }
    // if (fds) console.log(fds);
  });
});


// explore page
app.get('/explore', function(req, res) {
  var sql_list = 'select * from ct_db_devops.arts';
  pool.query(sql_list, function (error, results, fds) {
    if (error) throw error;
    if (results){
      // console.log(results);
      res.render('pages/explore',{"art_list":results});
    }
    // if (fds) console.log(fds);
  });
  
});

// add page
app.get('/add', function(req, res) {
  res.render('pages/add');
});

// about page
app.get('/about', function(req, res) {
  res.render('pages/about');
});





// about page
app.get('/about', function(req, res) {
  res.render('pages/about');
});




////////////////////////  Post Controllers  ////////////////////////



app.post("/uploadArt",function (req, res, next) { 

  
  var formData  = new formidable.IncomingForm();
  formData.parse(req,function(err,fields,files){
    var extension = files.file.originalFilename.substr(files.file.originalFilename.lastIndexOf("."));
    
    if(!(extension==".png" || extension==".jpg" || extension==".jpeg")){
      res.send("Please upload an image file with jpg , png or jpeg extension , currently uploaded extension : "+extension)
    }
    // console.log(fields.art_name)
    // console.log(fields.artist_name)
    // console.log(files.file.originalFilename)
    // console.log(files.file.filepath)
    

    var newPath = "uploads/"+ Date.now() +"-"+fields.file_name;

    fs.rename(files.file.filepath, newPath , function(err){
        if(err) { 
            res.send(err) 
        } else { 

            //configuring parameters
            var params = {
              Bucket: process.env.AWS_ART_BUCKET,
              Body : fs.createReadStream(newPath),
              Key : "folder/"+path.basename(newPath)
            };

            // uploading the art into bucket
            s3.upload(params, function (err, data) {
              //handle error
              if (err) {
                // console.log("Error", err);
              }
            
              //success
              if (data) {
                // console.log("Uploaded in:", data.Location);

                // since uploaded to s3 removng from local storage
                try {
                  fs.unlinkSync(newPath)
                  //file removed
                } catch(err) {
                  console.error(err)
                }

                // puttng data in db

                // console.log(fields.art_name)
                // console.log(fields.artist_name)
                pool.query('USE ct_db_devops', function (error, results, fds) {
                  if (error) throw error;
                  // console.log('ct_db_devops is being used');
                });
 
                // inserting row in db
                
                var sql_insert = 'INSERT INTO ct_db_devops.arts (artname,artistname,arturl) VALUES (' + '"' + fields.art_name + '","' + fields.artist_name + '","' + data.Location+'")';
                pool.query(sql_insert, function (error, results, fds) {
                  if (error) throw error;
                  if (results){
                    // console.log(data.Location)
                    res.render("pages/added_to_gallery",{"added_art":{"art_name":fields.art_name,"artist_name":fields.artist_name,"art_url":data.Location}}) ;
                  }
                  // if (fds) console.log(fds);
                });
              }
            });

                    
        }
    })


  }) 
}) 















app.listen(8080);
// console.log('Server is listening on port 8080');