const environments = {};

environments.development = {
  httpPort: 3333,
  httpsPort: 3334,
  envName: 'development',
  hashSecret: 'secretHashSecret',
  maxUserChecks: 5,
  twilio: {
    accountSid: 'ACcd2830aabd729eec065b1f77e29617cc',
    authToken: 'c988aa0de34dc6d6c914b9eadcd83b95',
    from: '+12029523124'
  }
};
environments.staging = {
  httpPort: 8080,
  httpsPort: 8081,
  envName: 'staging',
  hashSecret: 'secretHashSecret',
  maxUserChecks: 5,
  twilio: {
    accountSid: '',
    authToken: '',
    from: ''
  }
};
environments.production = {
  httpPort: 80,
  httpsPort: 443,
  envName: 'production',
  hashSecret: 'secretHashSecret',
  maxUserChecks: 5,
  twilio: {
    accountSid: '',
    authToken: '',
    from: ''
  }
};

const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLocaleLowerCase() : '';

const environement = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments['development'];

module.exports = environement;