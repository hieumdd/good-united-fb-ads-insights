import axios from 'axios';

export const getSecret = (name: string) =>
    axios
        .get('https://api.doppler.com/v3/configs/config/secret', {
            params: {
                project: 'eaglytics',
                config: 'prd',
                name: name,
            },
            auth: {
                username: process.env.DOPPLER_TOKEN || '',
                password: '',
            },
        })
        .then(({ data }) => <string>data.value.raw);

export const getAccessToken = getSecret('FACEBOOK_ACCESS_TOKEN');
