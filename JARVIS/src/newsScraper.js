const axios = require('axios');

const ESPN_NEWS_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news';

/**
 * Fetches the latest NFL news from ESPN.
 * Returns an array of article objects containing headline, description, published, etc.
 */
async function fetchLatestNews() {
  try {
    console.log('📰 Fetching latest NFL news from ESPN...');
    const response = await axios.get(ESPN_NEWS_URL);
    if (response.data && response.data.articles) {
      return response.data.articles;
    }
    return [];
  } catch (error) {
    console.error('❌ Failed to fetch NFL news:', error.message);
    return [];
  }
}

module.exports = {
  fetchLatestNews
};
