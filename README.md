# Call a lambda securely
The idea here is to have a lambda sitting in amazong that you call from edge from inside of node.js. This example assumes that you you have a kvm called: `creds` with two keys:

* AWS_ACCESS_KEY_ID
* AWS_SECRET_ACCESS_KEY

The values here should be the encrypted strings of the access key and secret respectively. These are the keys used to deploy and execute your amazon lambda function.

There is a sample script located in this directory that accepts a string argument as a parameter and then encrypts it. Simply take that value and create the kvm settings as appropriate.

# The lambda
With that part done you'll want to deploy a lambda. I've provided a sample lambda here that's deployable using serverless. Deploy this into an aws-account and make note of the region and stage and so on. You'll need to set that in the edge-node script when it runs `lambda.invoke()`. Or, just use eu-west-1 as I did an leave everything the same and it will just work.

The lambda simply calls http://httpbin.org/ip and fetches the gw ip that it used for egress from AWS.

# The apiproxy
The api proxy is a barebones nodejs script. If you call it with `/credentials` then it will spit back the kvm credentials in their encrypted format. If you call it directly with `/` then it will use those fetched and decrypted credentials to call lambda.invoke() and then spit back that response.

Deploy the proxy like so using apigeetool and replace with your own organization and username:
```bash
apigeetool deployproxy -d . -o <organization> -n callLambda -u <username>  -e prod,test -V```
