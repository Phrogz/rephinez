const {stddev} = require('../utils')
module.exports = function(season) {
    const instances = season.firstVersusLast()
    const dev = stddev(instances)*5
    return {
        score: dev
    }
}