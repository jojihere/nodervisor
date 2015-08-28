var config = {};

// Database configuration params.
// These are the connection parameters passed to our Knex db wrapper.
// Uncomment/Comment one of the below to switch between either Mysql or Sqlite.
// The format for this object is taken directly from Knex's connection object.
// Refer to the following if you wish to use PostgreSQL or connection pooling.
// http://knexjs.org/#Installation-client
// --
// Mysql Config:
//
// config.db = {
// 	client: 'mysql',
// 	connection: {
// 		host: 'localhost',
// 		user: 'root',
// 		password: '',
// 		database: 'nodervisor',
// 		charset: 'utf8',
// 	}
// };
//
// --
// We're using Sqlite by default now.
// Sqlite config:
//
config.db = {
	client: 'sqlite3',
	connection: {
		filename: './nodervisor.sqlite'
	}
};
// End of Database config

// Session storage config
// We're using Knex as with the db above, but only using sqlite and not mysql
// The express-session-knex module seems to have issues with mysql locks.
config.sessionstore = {
	client: 'sqlite3',
	connection: {
		filename: './nv-sessions.sqlite'
	}
};

// Application env config
config.port = process.env.PORT || 3000;
config.env = process.env.ENV || 'production';
config.sessionSecret = process.env.SECRET || '1234567890ABCDEF';




var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({region: 'us-west-2'});

// Read and write settings
config.readHosts = function(db, callback){

	var params =  {
        Filters : [
            {
                Name: 'tag:env',
                Values: [
                    'prod'
                ]
            },
            {
                Name: 'tag:code',
                Values: [
                    'integrations'
                ]
            },
            {
                Name: 'instance-state-code',
                Values: [
                    '16'
                ]
            }
        ]
    };

    ec2.describeInstances(params, function(err, response) {
        if(err) {
            return callback(err);
        }

        var hosts = {};
        
        response.Reservations.forEach(function(reservation) {
            reservation.Instances.forEach(function(instance) {
        	 	var name = '';

                for (var i = 0; i < instance.Tags.length; i++) {
                	var tag = instance.Tags[i];
                	if(tag.Key == 'Name')
                		name = tag.Value;
                };
            	var host = {
            		Name : name,
                	idHost : instance.InstanceId,
                	Url : 'http://' + instance.PublicIpAddress + ':9001',
                	GroupName : 'integration_workers'
                };
               
                hosts[host.idHost] = host;
            });

            config.hosts = hosts;
			// Call the callback passed
			if (callback) {
				callback();
			}
        });
        
       	

    });
};

module.exports = config;
