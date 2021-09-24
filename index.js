require('dotenv').config();
const axios = require("axios");

const getAdsInsights = async (adAccountId) => {
  try {
    const res = await axios.post(
      `https://graph.facebook.com/v12.0/${adAccountId}/insights`,
      {
        access_token: process.env.ACCESS_TOKEN,
      }
    );
    res;
  } catch (err) {
    console.log(err);
  }
};

getAdsInsights('act_3921338037921594');
