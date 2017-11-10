const Promise = require('bluebird'),
				fetch = require('node-fetch');

module.exports.hello = (ev, ctx, cb) => {
				fetch( 'http://httpbin.org/ip' )
				.then( d => d.json() )
				.then( d => {
								console.log('managed to fetch the ip');
								cb(null,d);
				})
				.catch( e => {
								console.error('failed with error: %s', e.stack);
								cb( null, {statusCode: 500, msg: e.msg});
				});
};
