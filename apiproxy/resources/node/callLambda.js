const express = require('express'),
				Promise = require('bluebird'),
				aws = require('aws-sdk'),
				apigee = require('apigee-access'),
				crypto = require('crypto');

// Set up Express environment and enable it to read and write JavaScript
var app = express();
var lambda = {};
var creds = {};
var alg = 'aes-256-ctr';
var pwd = 'thisiscool';


var kvm = apigee.getKeyValueMap('creds', 'environment');

function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

function kget(k) {
	return new Promise( function(res,rej)  {
		kvm.get(k, function(e,r) {
			if (e) {
				console.error('failed in here with %s', e.stack);
				rej(e);
			}
			else {
				console.log('fetched this: %j', r);
				creds[k] = decrypt(r);
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
	res.jsonp(creds);
});

app.listen(9000);
console.log('Listening on port 9000');
