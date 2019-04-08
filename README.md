# Overview
Onǣlan is a generic tool for optimizating hard-to-solve problems through a bit of brute force, a bit of luck,
and a bit of artistry.

For example, maybe you want to create a really "good" schedule for your sports league. You provide:

* An initial schedule (good or bad).
* A method for taking one schedule and producing a slightly different one.
* One or more methods that measure a schedule and tell how "good" or "bad" it is.

Onǣlan will (with a little help from you) keep varying the schedule, guiding towards a really good one.

HatShuffler uses [simulated annealing](https://en.wikipedia.org/wiki/Simulated_annealing) to "solve" what
would otherwise be nightmare problems in combinatorics. It doesn't find the absolute best result,
but it finds ones that are quite good, relatively quickly. This takes a little bit of art and finesse from you
to help tune the algorithm as it runs. More on that below.

# Table of Contents

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

* [Overview](#overview)
* [Table of Contents](#table-of-contents)
* [Installing](#installing)
* [Creating a Scenario](#creating-a-scenario)
	* [The Scenario Description](#the-scenario-description)
	* [Ranking your States](#ranking-your-states)
* [Running](#running)
	* [Modifying Rankings & Ranking Weights](#modifying-rankings-ranking-weights)
	* [Modifying Run Parameters](#modifying-run-parameters)
	* [Picking the Right Values](#picking-the-right-values)
* [Saving and Restoring Seasons](#saving-and-restoring-seasons)
* [Adding New Rankings](#adding-new-rankings)
* [TODO](#todo)
* [History](#history)
* [License & Contact](#license-contact)

<!-- /code_chunk_output -->


# Installing

HatShuffler requires [Node.js](https://nodejs.org/en/), and runs on a wide variety of operating systems.

The easiest way to get the project is to use [Git](https://git-scm.com/) to pull the source code:

```sh
# creates and fills a directory `hatshuffler` in your current directory
git clone https://github.com/Phrogz/onǣlan.git
cd onǣlan
```


# Creating a Scenario

A "scenario" describes the problem you are trying to solve. All the code for your scenario gets placed as
a directory inside the `scenarios` directory. For example, if you are trying to solve your league's
scheduling problems, create a directory `scenarios/myscheduler/`.

Example scenarios are already in the `scenarios` directory to help guide you to creating your own scenario.

## The Scenario Description

Your scenario must have a file named `scenario.js` at the root of your scenario's directory.
This file must export an object as shown :

```js
module.exports = {
    name: '...',             // (optional) the display name of your scenario

    /*** functions related to states *****************************************************************/
    initial: ƒ,  // a function that produces the initial "state" to start with
    vary:    ƒ,  // a function/method that takes one state and creates a new, slightly different state
    save:    ƒ,  // a function/method that serializes the state to a string
    load:    ƒ,  // a function that converts a serialized state into a real one
    clone:   ƒ,  // (optional) a function/method that takes one state and returns a copy of it

    /*** controlling the temperature; either falloff time or variations must be supplied (but not both) ******/
    tempStart:                  5, // temperature to use when starting a round of optimization
    tempFalloffTime:            2, // number of seconds after which it should reach one percent of initial temp
    tempFalloffVariations:    200, // number of variations after which it should reach one percent of initial temp

    /*** how often to peek at the optimization progress ******************************************************/
    checkinAfterTime:           1, // invoke the 'checkin' callback every this-many seconds
    checkinAfterVariations:   100, // invoke the 'checkin' callback every this-many variations
    checkinAfterScore:        0.5, // invoke the 'checkin' callback every this-many score improvements

    /*** (optional) occasionally restart optimization, starting from the best state **************************/
    restartAfterTime:           3, // restart a new round after this many seconds in the round
    restartAfterVariations:   5e2, // restart a new round after this many variations in the round
    restartAfterScore:         20, // restart a new round if a score greater than or equal to this is accepted
    restartAfterTemperature: 1e-6, // restart a new round if the temperature falls below this

    /*** when to stop and serialize the optimization; at least one of these should be supplied  **************/
    stopAfterTime:             99, // stop optimization after this many seconds
    stopAfterVariations:      1e5, // stop optimization after this many variations
    stopAfterScore:             0, // stop optimization if a measurement produces a score less than or equal to this
    stopAfterRounds:          1e3, // stop optimization after this many rounds have been exhausted

    // rankings to run, and the default importance of each ranking relative to the others
    weightings: {
        ranking1Name:   3.2,
        ranking2Name:   1.7,
        ranking3Name:   91,
        ...
    }
}
```

The `vary`, `save`, and `clone` functions are all invoked with the state as the `this` context, as well as passing
the state as a parameter. This allows you to use class instances for your states and supply methods that operate
on the instance. For example:

```js

```

## Ranking your States

Your scenario must also have a `rankings` subdirectory, with one or more ranking modules in it, whose file
names match the names supplied in your `weightings` description.


# Running

First, edit `config.js` to specify the file where your player data is stored,
and control the number of teams and rounds generated:

```js
players: 'data/demo.csv',     /* see data/README.md for file details                  */
teams:   4,                   /* how many teams are the players split into each round */
rounds:  6,                   /* how many rounds of play are there                    */
```

Next, from the command-line run `node main.js` to launch the application.
It will generate intial teams for the players (pretty good for the first round)
and then just repeat those teams for the next rounds (terrible).
It will show you a summary of the season, and ask you what you want to do next.


## Modifying Rankings & Ranking Weights

Each time HatShuffler makes a new season it runs a series of 'rankings' to see how good the season is.
These rankings are stored in the `rankings/` directory. See the top of each file for a description on
what it attempts to measure.

Every measurement uses 0 as the **best** score. As in golf, the higher the score, the worse the season.
Not all rankings have the same scale, and not all are as important as others. If you see a ranking that
is getting bad scores, and you want to increase its relative importance in determining the overall score,
edit `config.js`:

```js
/* how important is each ranking relative to the others */
weightings: {
    distributedWomen:      0,
    distributedGiants:     4,
    distributedSpeed:      2,
    distributedXP:         1,
    teamsAreFair:          3,
    playerExposure:        6,
    distributedScheduling: 4,
}
```

In the above, the `distributedWomen` ranking is ignored (not even run).
_(The season-modification algorithm already ensures that they are always distributed.)_

Turning off rankings speeds up the overall performance of HatShuffler.

Changes made to `config.js` are used each time you set the algorithm in motion with `(g)o`.
You can edit the file at other times, but it won't take effect in the middle of an optimization run.


## Modifying Run Parameters

When you let the application `(g)o` it runs for a fixed number of "iterations". Each iteration it
modifies the current season a little bit, by picking a round at random, and then picking two players
of the same sex and swapping them. Then it measures the result using the rankings (described above).

* If the new season is better: Great! That's our new best season!
* If the new season is worse, we _maybe_ discard it, maybe use it and see where it leads us.

If we never accepted worse seasons, we could get stuck in a "local minimum". No simple player swap would
make our season better, but maybe if we made 10 terrible trades we'd suddenly be in a much better position.

The simulated annealing algorithm uses "temperature" to help make the decision. Temperature is an internal
number used by the program. The temperature starts out hot and cools down over time. When it's hot, the
application is more likely to accept a worse season. As it cools, it will only accept seasons that are a
little worse, and eventually only better seasons.

However, experience shows that we may need to explore many "dead end" seasons before finding one that leads
us down the right path. Instead of you sitting at the computer and pressing `(g)o` repeatedly, a single
annealing run of HatShuffler periodically abandons what it's doing, picks up the best season its found,
turns the temperature back up and starts again.

All the background knowledge above lets you tune these settings in `config.js`:

```js
iterations:   1e5, /* how does the algorithm run before giving you a chance to tweak these values and continue */
checkinEvery: 1e3, /* how often should the score and rankings be printed; too often slows things down          */
maxTemp:      4,   /* higher temps allow the algorithm to wander into terrible scores…to escape local minima   */
useBestEvery: 5e2, /* after this many iterations, switch back to the best state so far and start hot again     */
```

The scientific notation above—`1e5` instead of `100000`—is just so that you can change numbers by orders of
magnitude without OCD forcing you to re-align the comments. :)


## Picking the Right Values

The values for the first two parameters are mostly up to your preference:

* If `iterations` is too high, you'll have to wait a long time before you can tweak rankings or temperatures.
* If `iterations` is too low, you'll just have to keep typing `g <enter>` to go again after each run.
* If `checkinEvery` is too high, you'll (slightly) slow down the algorithm as wastes time keeping you informed.
* If `checkinEvery` is too low, you'll bite your fingernails dying to find out if things are going well.

The other two parameters can heavily affect how quickly you get a really good season generated:

* If `maxTemp` is too high, the algorithm will keep choosing terrible seasons and spend too little time on good ones.
* If `maxTemp` is too low, the algorithm will get stuck in local minima. Try raising the temp if you are stuck on a certain score.
* If `useBestEvery` is too high, the algorithm will spend more time on what may be dead end attempts.
* If `useBestEvery` is too low, the algorithm may not have time to explore paths before the temperature cools off and it starts over.


# Saving and Restoring Seasons

Every time an optimization run completes a file is saved in the `data` folder, named with the current date and time, e.g. `state-20190322T150550.csv`.

This file is tab-delimited with a simple data format: one row for each player with the player's name, sex (`M` or `F`), a blank column, and then the color of the team that person is on in each round. For example, the data might look like:

```text
Markle Phette     M   Red     Blue    Green   White   Red     Blue
Adlai Patrone     M   Red     Green   Red     White   Blue    Red
Elmet Cotta       M   Red     Blue    White   Green   White   Green
Taddeo Tubb       M   Red     Blue    Green   Red     Red     White
Flora Jambrozek   F   Red     White   Green   Green   Red     Red
Kalli McGoon      F   Red     Green   Red     Green   White   Green
Reilla Greason    F   Red     Red     Blue    Blue    White   White
Dorey Bryde       F   Red     White   White   Blue    Green   White
Bartlett Gurery   M   Green   Blue    White   White   Red     Green
Ravid Yerrell     M   Green   Red     Red     Blue    White   Green
...
```

_The above has been aligned using spaces to make it easier to read._

This says that, for example, "Adlai" is male, plays on the Red team in round 1, the Green team in round 2, etc.

The file is designed to be copy/pasted into Excel or Google Sheets.
However, it can also be used to test out different modifications.

For example, say that Elmet and Dorey have paid you a bribe to put them on the same team. You want to see how much
doing this would wreck the perfect schedule that HatShuffler created for you. First, you save the CSV file as
`cheaters.csv` and then hand-edit it to swap team assignments. Note that if you just copy Elmet's teams and paste
them on Dorey's row you will be changing the team sizes each round, so you probably want to swap Dorey with other
players.

Once you have the proposed schedule ready, edit `config.js` and set the `"season"` key to reference your new file:

```js
    players: 'data/demo.csv',     // see data/README.md for file details
    season:  'data/cheaters.csv', // load this file as the initial season
```

Quit HatShuffler (if it was running), and then start it again (`node main.js`). HatShuffler will show you the new
score for the season you created. If you like, you can `(g)o` to start shuffling things around to try and make
the season better. In the case where you modify the season to impose special rules—such as keeping two players
together—optimizing the season will likely undo your work. To change the rules you need to add new rankings:


# Adding New Rankings

If you want the optimization to take new criteria into account, you can add your own "ranking" plugins. This requires:

1. Adding a new file to the `rankings` directory, and
2. Adding the name of that file to the `weightings` section of `config.js` with a non-zero weighting value.

For example, let's add a ranking that tries to keep Elmet and Dorey on the same team. First, create a new file named
`rankings/elmetAndDorey.js`, and put code in it like so:

```js
// Try to keep players named "Elmet" and "Dorey" on the same team
module.exports = function(season) {
    // This will be a multiple of 2, since each time Elmet and Dorey are on different
    // teams we will get a hit for each one of them.
    let timesOnDifferentTeams = 0
    season.teams.forEach(team=>{
        const matching = team.players.filter(player => /^(Elmet|Dorey)/.test(player.name))
        if (matching.length===1) timesOnDifferentTeams++
    })
    return {
        score: timesOnDifferentTeams * 3 // Inflate the score so that a couple misses is really bad
    }
}
```

Every ranking plugin must export a function that takes the current season and returns an object with a `score` value.
The score must be calculated such that lower values represent better seasons, with 0 being perfection for this ranking.

To see the properties and methods available to you, see the `lib/gru.js` file.

The range of values is up to you, but ideally all rankings have a similar scale. If one ranking uses values in the
range [0-10] to represent the continuum between a perfect season and a useless one, but another ranking uses values
in the range of [0-100], then the latter ranking will have more 'weight' than the former, and will be optimized for
at the expense of the former. You will have to supply very different weightings for the rankings to balance them out.

The rankings in HatMaster are currently written to (very roughly) treat values of 10+ as "pretty bad".

Your ranking plugin can also, optionally, return a `stats` key in its results. This allows you, HatMaster General, to
summarize what the season you're measuring looks like from the perspective of your ranking plugin.
This should be an object mapping labels to the data to show. For example, the `playerExposure` ranking returns this:

```js
return {
    score:max + avg/2 + shortages.standardDeviation(),
    stats:{
        "Players Missed, per Player": shortages.join(' '),
        "Avg Number of Players Missed": shortages.average().toFixed(1),
        "Most Reclusive Player Missed": max,
    }
}
```


# TODO

* Clean up files/folders so that the main shell is 100% generic and separated from GRU/seasons.
* Clean up files/folders and document what each file is for.
* Either promote customized annealing library to main, or fork into its own npm. (Git submodules are annoying.)
* Provide a web-based front-end in lieu of the ghetto console-based interface.


# History

* 2019-03-25 — v0.6.0 save/restore seasons
* 2019-03-21 — v0.5.0 just barely working


# License & Contact

HatShuffler is copyright ©2019 by Gavin Kistner and is licensed under the [MIT License](http://opensource.org/licenses/MIT). See the LICENSE file for more details.

For bugs or feature requests please open [issues on GitHub](https://github.com/Phrogz/hatshuffler/issues). For other communication you can [email the author](mailto:!@phrogz.net?subject=hatshuffler) directly.
