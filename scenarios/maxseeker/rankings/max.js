module.exports = function(x) {
    const y = (Math.sin(30*x)**2 - Math.cos(5*x)) * x**2
    // Higher values of y are better, thus lower score
    return { score: -y }
}