import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION || '',
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
    userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
  },
  API: {
    endpoints: [
      {
        name: 'todoAPI',
        endpoint: process.env.NEXT_PUBLIC_API_ENDPOINT || '',
        region: process.env.NEXT_PUBLIC_AWS_REGION || '',
      },
    ],
  },
};

Amplify.configure(amplifyConfig);

export default amplifyConfig; 