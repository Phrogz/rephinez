# Overview
Rephinez is a generic tool for optimizating hard-to-solve problems through a bit of brute force, a bit of luck,
and a bit of artistry.

For example, maybe you want to create a really "good" schedule for your sports league. You provide:

* An initial schedule (good or bad).
* A method for taking one schedule and producing a slightly different one.
* One or more methods that measure a schedule and tell how "good" or "bad" it is.

Rephinez will (with a little help from you) keep varying the schedule, guiding towards a really good one.

Rephinez uses [simulated annealing](https://en.wikipedia.org/wiki/Simulated_annealing) to "solve" what
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
* [Saving and Restoring States](#saving-and-restoring-states)
* [TODO](#todo)
* [History](#history)
* [License & Contact](#license-contact)

<!-- /code_chunk_output -->


# Installing

Rephinez requires [Node.js](https://nodejs.org/en/), and runs on a wide variety of operating systems.

The easiest way to get the project is to use [Git](https://git-scm.com/) to pull the source code:

```sh
# creates and fills a directory `rephinez` in your current directory
git clone https://github.com/Phrogz/rephinez.git
cd rephinez
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
    yardsticks: {
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
// TODO
```

## Ranking your States

Your scenario must also have a `rankings` subdirectory, with one or more ranking modules in it, whose file
names match the names supplied in your `yardsticks` description.


# Running

// TODO: command line versus web


## Modifying Rankings & Ranking Weights

// TODO: command-line editing `scenario.js`, web live editing


## Modifying Run Parameters

// TODO: command-line editing `scenario.js`, web live editing


### Picking the Right Values

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

// TODO: document the impact of all the parameters, not just the old HatShuffler ones

# Saving and Restoring States

Every time an optimization run completes a file is saved in the `data` folder of your scenario,
named with the current date and time, e.g. `state-20190322T150550.csv`.

// TODO: hand-editing the file, modifying config to load that from disc, web loading


# TODO

* Finish examples
* Update documentation for yardsticks
* Update documentation for mutating vs. fresh states
* Make the console-based interface take
* Provide a web-based front-end in lieu of the ghetto console-based interface.


# History

* ...still awaiting an initial release...


# License & Contact

Rephinez is copyright ©2019 by Gavin Kistner and is licensed under the [MIT License](http://opensource.org/licenses/MIT). See the LICENSE file for more details.

For bugs or feature requests please open [issues on GitHub](https://github.com/Phrogz/rephinez/issues). For other communication you can [email the author](mailto:!@phrogz.net?subject=Rephinez) directly.
