This scenario is a modified [Travelling Salesman
problem](https://en.wikipedia.org/wiki/Travelling_salesman_problem): a diner has
a list of restaurants to visit around the country. Some restaurants serve only
vegetarian options, and some serve only meat. The diner wants to minimize the
amount of distance traveled on the entire trip, but also would *also* like to
alternate eating between each type of restaurant.

This scenario provides an example of using
[SVG](https://en.wikipedia.org/wiki/Scalable_Vector_Graphics) to visualize the
state.

![A graph of scattered green and pink nodes, with directed edges showing a route
that ](example.png)

# Initial Setup

The list of all restaurants is sorted into a random order to visit them.


# Variations

For each variation, two restaurants in the list are selected at random and their
places in the list are swapped.


# Yardsticks

* **Total Distance** — sums the total of distances between each pair of restaurants.
* **Repeat Meals** — counts how many times the diner was forced to eat at the same
  type of restaurant twice in a row.


# Things to Try

* Set the _Repeat Meals_ yardstick to `0` and optimize to find out the shortest
  distance possible.
* Set the _Total Distance_ yardstick to `0` and the _Repeat Meals_ yardstick to
  `10` to see if it is possible to completely alternate.
* Try editing the types or placements of restaurants in `scenario.js` to vary
  the problem space.
* Try different yardstick weights. How close to the minimum distance can you get
  with complete alternation?