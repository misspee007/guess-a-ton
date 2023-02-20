exports.CONFIG = {
  ENDPOINT: process.env.NODE_ENV === "production" ? "https://guess-a-ton.onrender.com" : process.env.REACT_APP_API_URL
};