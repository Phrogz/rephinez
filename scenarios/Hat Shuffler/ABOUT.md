This scenario takes a league of players and places them on different teams each round,
with the goals of ensuring that:

1. Players get to play with as many different people as possible.
2. Teams are as fair as possible within a round.


# Initial Setup
The scenario can either generate a starting schedule from scratch,
or injest a previously-saved schedule to use as the starting point.

When generating a new schedule, it splits the players into men and women,
sorts them by the `Player.prototype.ranking()` function, and then distributes
them across the specified number of teams. These initial teams are duplicated
across all rounds.


# Variations
At each step the scenario picks a random round, picks two teams at random,
randomly decides if it's going to swap men or women, and then swaps two players
of the same gender between those two teams.


# Yardsticks

* **Distributed Women** – measures how many women each team has and returns the
  standard deviation of them. This yardstick is not used, since the initial season
  generation distributes the genders evenly and the variation algorithm ensures
  that this distribution is maintained.

* **Distributed Giants** — measures the standard deviation of players over 6 feet
  on each team.

* **Distributed Speed** — measures the standard deviation of players who self-ranked
  themselves as having good athleticism across the teams.

* **Distributed XP** — measures the standard deviation of players who started playing
  Ultimate before 2010.

* **Fair Teams** — a messy yardstick, this should probably be split into multiple
  yardsticks. It currently tries to balance two measurements: the average player vector
  per team, and the average team vector that each player got to play on.

  The goal of the first may be obvious: ensuring that in each round all teams have
  roughly the same skill.

  The goal of the second is to ensure that when the average vector for a team isn't
  consistent—when the first measurement can't be zero due to other constraints—that
  no player is consistently placed on teams that are below average.

  Player vectors are calculated using a formula, **not an imported value**. Based on
  how incorrect this formula can be, this likely should be changed to allow humans
  to pre-rank players.

* **Player Exposure** — attempts to ensure that everyone gets to play with everyone else.
  Measures how many people each person missed (didn't get to play with), and then balances
  the average of these values (to ensure most people see most people) with the maximium of
  these values (to help ensure no one person gets really left out) with the standard deviation
  of these values (to help ensure that everyone misses out on the same number of people).

* **Distributed Scheduling** — measures the standard deviation of players across teams,
  to help ensure that no one person gets stuck on the same team (and hence the same schedule
  time slot) all the time.