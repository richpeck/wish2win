///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

// Express
// Added a bunch of stuff from https://stackoverflow.com/a/5994334/1143732
// BaseURL https://github.com/expressjs/express/issues/1611#issuecomment-38358502
const express = require('express')
const cors    = require('cors')
const app     = express()
const router  = express.Router()

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
//          _____ _                 _  __                    //
//         /  ___| |               (_)/ _|                   //
//         \ `--.| |__   ___  _ __  _| |_ _   _              //
//          `--. \ '_ \ / _ \| '_ \| |  _| | | |             //
//         /\__/ / | | | (_) | |_) | | | | |_| |             //
//         \____/|_| |_|\___/| .__/|_|_|  \__, |             //
//                           | |           __/ |             //
//                           |_|          |____/             //
//                                                           //
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

// Shopify
// https://www.npmjs.com/package/shopify-api-node
const Shopify = require('shopify-api-node');
const shopify = new Shopify({
  shopName: process.env.SHOPIFY_NAME,
  apiKey:   process.env.SHOPIFY_API,
  password: process.env.SHOPIFY_PASS
});

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
//             _____                                         //
//            /  ___|                                        //
//            \ `--.  ___ _ ____   _____ _ __                //
//             `--. \/ _ \ '__\ \ / / _ \ '__|               //
//            /\__/ /  __/ |   \ V /  __/ |                  //
//            \____/ \___|_|    \_/ \___|_|                  //
//                                                           //
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

// The server runs on the NGinx reverse proxy
// As long as it's on port 3000, should be okay
app.set('port', (process.env.PORT || 3000))
app.use(express.static(__dirname + '/public')) // Assets

// Base URL
// This is meant to provide users with the ability to access the app on /order
// It allows us to use relative URL's without having to make a big deal about accepting inbound requests etc
app.use('/', router);

// BodyParser
// Allows us to view/manage data passed through the body tag of the request
// https://stackoverflow.com/a/24330353/1143732
// No need for bodyparser package anymore - https://expressjs.com/en/4x/api.html#express.json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Error
// https://webapplog.com/error-handling-and-running-an-express-js-app/
app.use(function(err, req, res, next) {
    if(!err) return next(); // required otherwise the middleware will fire every time

    // Erroneous response
    // https://gist.github.com/zcaceres/2854ef613751563a3b506fabce4501fd#handling-errors
    if (!err.statusCode) err.statusCode = 500; // If err has no specified error code, set error code to 'Internal Server Error (500)'
    res.status(err.statusCode).send(err.message); // All HTTP requests must have a response, so let's send back an error with its status code and message
});

// Server
// Allows us to accept inbound requests
app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

// INBOUND
// https://g6k.carte-grise-pref.fr/order (POST)
// This has to be JSON/XHR only && accept the data from the submitted form
// This will take the data, send it to Shopify and then build a "checkout" response
router
  .route('/')
  .get(express.urlencoded({extended: false}), cors(), function(request, response, next) {

    // Orders
    shopify.order.list({ fields: ['id','line_items'] }).then(function(orders){

      // Array
      var array = [];

      // Cycle through response
      orders.forEach(function(element) {
        element['line_items'].forEach(function(line_item) {
          if(line_item['product_id'] == request.query.id) {
            line_item['properties'].forEach(function(property){
              if(property['name'] == "Ticket"){
                array.push(property['value']);
              }
            });
          }
        });
      });

      // Response
      response.send(array);

    });
});

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
