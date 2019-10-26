let baseURL = '';
if (process.env.SITE_VERSION !== process.env.CURRENT_VERSION) {
    baseURL = `/${process.env.SITE_VERSION}`;
}

module.exports = { baseURL };