function average(array) {
    return array.reduce((a,b)=>a+b, 0) / array.length
}
module.exports = {
    stddev(a) {
        const avg = average(a)
        return Math.sqrt(average(a.map(n=>(n-avg)**2)))
    },

    average
}
