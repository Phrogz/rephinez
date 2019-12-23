This scenario attempts to find the maximum of the function
`(sin(30x)² - cos(5x)) * x²`
within the domain of 0 ≤ x ≤ 1.


# Initial Setup
The scenario is seeded by starting with _x_ = `0.5`


# Variations
The variation of _x_ at each step is hardcoded in `scenario.js`, and simply adds a
random amount within the range of ±0.02 to the previous value of _x_, and clamps
it to the range of [0,1].


# Yardsticks

* **max** — this yardstick runs the formula. Since we are searching for large values
instead of small, the yardstick inverts the result. Because yardsticks must return
values greater than 0 this yardstick adds 20 to the result, using the 'cheating'
foreknowledge that the value of the function will never be that large.


# Visualization

The visualization of this scenario inside Rephinez is a work in progress.

Eventually I hope to make its visualization be like one of the three HTML files in this
directory. View them standalone to witness some pre-run simulations.

* `visualization-toocold.html` shows what can happen if you do not allow the
  temperature to be hot enough. The variations will not choose 'bad' changes often
  enough, and as a result you can get stuck in a local minima. (Remember that the
  return value of the yardstick is inverted, so the local maxima of the function
  becomes a local minima of the yardstick.)

* `visualization-slowbutok.html` shows a simulation run that eventually finds the
  correct result, but takes a long time to get there due to small variations,
  lower temperatures, and long times spent before resetting.

* `visualization-fast.html` is a demonstration how turning up the temperature, making
  larger variatins, and resetting more quickly can drastically reduce the time it takes
  to get a good result. This simulation found the correct result in 5% of the variations
  that it took for "slowbutok" to get there. Before you try bruteforcing a solution
  through massive iteration times, try being reckless. It might pay off.
