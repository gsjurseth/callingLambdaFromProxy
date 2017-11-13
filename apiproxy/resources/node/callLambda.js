const express = require('express'),
	    Promise = require('bluebird'),
	    aws     = require('aws-sdk'),
	    apigee  = require('apigee-access'),
	    bp      = require('body-parser'),
	    crypto  = require('crypto');

// Set up Express environment and enable it to read and write JavaScript
var app = express();
app.use(bp.json());
var lambda = {};
var creds = {};
var alg = 'aes-128-cbc';
var pwd = 'thisiscool123456';


var kvm = apigee.getKeyValueMap('creds', 'environment');
var decipher = crypto.createDecipher(alg,pwd)

function decrypt(text){
	var dec = decipher.update(text,'hex','utf8')
	dec += decipher.final('utf8');
	console.log('deciphered credentials');
	return dec;
}

function kget(k) {
	return new Promise( function(res,rej)	{
		kvm.get(k, function(e,r) {
			if (e) {
				console.error('failed in here with %s', e.stack);
				rej(e);
			}
			else {
				console.log('fetched this from kvm: %j', r);
	      try {
	        var dec =  decrypt(r);
	      }
	      catch(e) {
	        console.error('failed deciphering: %s', e.stack);
	      }
				creds[k] = dec;
				res(r);
			}
		});
	});
}

Promise.map(["AWS_SECRET_ACCESS_KEY","AWS_ACCESS_KEY_ID"], kget)
.then( function() {
	lambda = new aws.Lambda( {
		accessKeyId: creds.AWS_ACCESS_KEY_ID, 
		secretAccessKey: creds.AWS_SECRET_ACCESS_KEY,
		region: 'eu-west-1'
	});
})
.catch( function(e) {
	console.error('failed setting up the lambda object with creds: %s', e.stack);
});

aws.config.setPromisesDependency(Promise);

app.get('/', function(req, res) {
	var params = {
		FunctionName: "myLambda-dev-hello", 
		Payload: JSON.stringify({})
 };
	lambda.invoke(params).promise()
	.then( function(r) {
		console.log('We received this from our lambda invokation: %j', r);
		res.jsonp(r);
	})
	.catch( function(e) {
		console.error('we failed somehow: %s', e.stack)
		res.jsonp({statusCode:500, msg: e.msg});
	});
});


app.get('/credentials', function(req, res) {
	console.log('this is a get');
	res.jsonp(Object.keys(creds));
});

/*
 * turns out the you can set kvm keys and values.. only read them
 *
app.post('/credentials', function(req, res) {
	console.log('this is a post and it has a body: %j', JSON.parse(req.body));
	new Promise( function(res,rej) {
	  if ( req.body.AWS_ACCESS_KEY_ID && req.body.AWS_SECRET_ACCESS_KEY ) {
	    res(req.body);
	  }
	  else {
	    rej('failed');
	  }
	})
	.then( function(d) {
	  res.jsonp(d);
	})
	.catch( function(e) {
	  res.jsonp( {statusCode:500, msg: 'failed updating keys'});
	})
});
*/

app.listen(9000);
console.log('Listening on port 9000');
