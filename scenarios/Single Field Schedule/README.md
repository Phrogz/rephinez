This scenario schedules sports teams playing multiple games each night on a
single field. It has repeatedly been used to good effect when scheduling an
Indoor Ultimate Frisbee league, usually with 8 teams playing 12 games, with each
team playing 3 games per night.

![Example output as a table showing four rows with twelve columns each, with
each cell showing the teams playing that round](example.png)

# Initial Setup
The season is seeded with a predefined schedule that ensures each team plays
multiple games each round, and plays other teams a similar number of times.
Modify the parameters passed to `multiGameRobin()` in the `initial` function for
the scenario to change the number of teams, games per round, or number of
overall rounds.

The current state is represented by an instance of a `Schedule` class.

# Variations
The schedule is varied at each step by picking a round at random, picking a pair
of games at random, and swapping the times for those two games.


# Yardsticks

* **Multiple Byes** — measures how often teams have to sit idle for more than
  one game. The measurement squares the result, because sitting by for two games
  is obnoxious, but sitting by for three+ games is way worse. The yardstick sums
  the result for all teams, and then adds in the standard deviation across the
  teams. Adding in the standard deviation helps make things fair, by increasing
  the measurement more when different teams have different amount of waiting.

* **Double Headers** — measures how often each team has to play a double-header,
  and sums the result across the season. The standard deviation per team is also
  added in, again to make things more fair.

* **Triple Headers** — as above, but counts how often teams have to play three
  games in a row. Turned out to be not necessary to get good results.

* **Even Scheduling** — measures how often teams get stuck with "early" games
  (the first three games in a round) versus "late" games (the last three in a
  round). Uses the standard deviation of these values across teams to make
  things fair. This measurement exists because players had previously expressed
  an interest in having variety in their game times from one week to the next.
  For some, the early games were difficult to get to in time. For others,
  staying late was a problem.

* **First vs Last** — counts how often a team's last game is played against
  another team's first game. The desire is to minimize how often exhausted teams
  get destroyed by a team that is coming in fresh.

* **Even First vs Last** — instead of putting a preset amount of standard
  deviation into the _First vs Last_ measurement, this yardstick breaks the
  standard deviation out into its own measurement. This allows more control over
  minimizing the problem versus ensuring that it is fair, and more insight into
  what is happening.

  This yardstick does not output any stats, as it is easy enough to eyeball how
  'fair' the stats are for _First vs Last_.


# Things to Try

When trying to optimize for many yardsticks at once, it is useful to know what
is possible before you strive to achieve the impossible.

For example, try setting _Multiple Byes_ to `1` and all other yardstick weights
to `0`. After several resets and runs it becomes clear that the variation
technique and scenario constraints mean that you can never get better than half
the teams forced to have one double bye, and the other teams having two double
byes. Now you can reset and optimizing the schedule for all your yardsticks,
noting that no amount of additional weighting will get that yardstick to `0`.
