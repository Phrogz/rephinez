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

- [Overview](#overview)
- [Table of Contents](#table-of-contents)
- [Installing](#installing)
- [Running via the Web Interface](#running-via-the-web-interface)
- [Creating a New Scenario](#creating-a-new-scenario)
  - [The Scenario Description](#the-scenario-description)
  - [Varying your States](#varying-your-states)
  - [Writing Yardsticks](#writing-yardsticks)
- [Running via Command Line](#running-via-command-line)
  - [Modifying Rankings & Ranking Weights](#modifying-rankings-ranking-weights)
  - [Modifying Run Parameters](#modifying-run-parameters)
    - [Picking the Right Values](#picking-the-right-values)
- [Saving and Restoring States](#saving-and-restoring-states)
- [TODO](#todo)
- [History](#history)
- [License & Contact](#license-contact)

<!-- /code_chunk_output -->


# Installing
Rephinez requires [Node.js](https://nodejs.org/en/), and runs on a wide variety of operating systems.

The easiest way to get the project is to use [Git](https://git-scm.com/) to pull the source code:

```sh
# creates and fills a directory `rephinez` in your current directory
git clone https://github.com/Phrogz/rephinez.git
cd rephinez
```


# Running via the Web Interface

1. Launch the web server.

   ```sh
   node webserver.js
   ```

2. Open a web browser and visit `http://localhost:8080`; you will see a list of scenarios with none selected:  
   <img alt="list of scenarios with none selected" src="docs/blank-scenario.png" height="32">

3. Select a scenario to work on from the pull down menu, and you will see the yardsticks, simulation
   controls, initial scenario, and yardstick stats:  
   <img alt="list of scenarios with none selected" src="docs/annotated-state.png" style="width:100%; max-width=1600px; display:block; margin:0 auto">

4. Review and adjust the Yardstick weights and their impact on the final score. Yardsticks resulting in
   a higher score will more heavily impact the state than those producing lower scores.

5. Review the optimization settings, primarily to ensure that your simulation will stop after a reasonable
   amount of time, giving you a chance to change settings and continue.

   * **Starting Temp** — Controls the initial temperature to use at the beginning of each optimization round. Higher
     temperatures make it more likely for the simulation to accept changes that increase the score. The amount of heat
     needed is partially dependent upon the overall score of the state. If you feel that your optimization is getting
     stuck, either increase the temperature or lower the weightings on your yardsticks.

   * **Falloff Over** — The temperature will asymptotically falloff towards zero during a round. This setting controls
     how long it takes for the temperature to reach 1% of the starting temp. Cooling off more slowly takes more time,
     but can help ensure that your state works out bad kinks. Cooling off too fast may lock in certain bad choices.

   * **Restart After** — As the simulation cools off, eventually your optimization will stall, unable to make any
     variations that help the overall score. At this point we want the simulation to heat back up again. This setting
     controls how long an optimization continues before we reset to the best state we've found so far, turn up the heat,
     and start a new round.
   
   * **Stop After** — When initially experimenting with a scenario you want to be able to periodically try different
     yardstick weights or temperatures. This setting controls how long the optimization runs before stopping, setting
     the current state to the best state found so far, and yielding control back to you. When you feel like you've done
     the best you can, but want to see if brute force can help, increase this value (and maybe that of _Restart After_)
     and walk away from the computer for a while.

   * **Update Every** — It's hard to wait and do nothing. This setting controls how frequently the optimization pauses
     and sends the best state back to the web browser, so that you can watch along, see how things are going, and plan
     for your next change.

6. Finally, when you are ready, press the "Play" button ▶ at the top of the screen to begin the
   optimization. The controls will be replaced with a progress bar while the optimization is in progress.

   <img alt="list of scenarios with none selected" src="docs/progress-bar.png" style="width:100%; max-width=1600px; display:block; margin:1em auto">

   When the progress can be determined—when "Stop After" is not based on a final score—the progress bar will fill
   with green as the progress continues. 

   Each time the progress finishes, not only are you shown the `html` version of the current best state on screen, but
   a serialized version of the state will be saved in the `data` directory for your scenario.


# Creating a New Scenario
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
    clone:   ƒ,  // (optional) a function/method that takes one state and returns a copy of it
    html:    ƒ,  // for the web interface, a function/method that returns a web-friendly representation of the state
    save:    ƒ,  // a function/method that serializes the state to a string
    load:    ƒ,  // a function that converts a serialized state into a real one

    tempStart: 5, // temperature to use when starting a round of optimization
    
    /*** controlling the temperature; either falloff time or variations must be supplied (but not both) ***/
    tempFalloffTime:            2, // number of seconds after which it should reach one percent of initial temp
    tempFalloffVariations:    200, // number of variations after which it should reach one percent of initial temp

    /*** how often to peek at the optimization progress (pick only one) ***/
    checkinAfterTime:           1, // invoke the 'checkin' callback every this-many seconds
    checkinAfterVariations:   100, // invoke the 'checkin' callback every this-many variations
    checkinAfterScore:        0.5, // invoke the 'checkin' callback every this-many score improvements

    /*** (optional) occasionally restart optimization, starting from the best state (pick only one) ***/
    restartAfterTime:           3, // restart a new round after this many seconds in the round
    restartAfterVariations:   5e2, // restart a new round after this many variations in the round
    restartAfterScore:         20, // restart a new round if a score greater than or equal to this is accepted
    restartAfterTemperature: 1e-6, // restart a new round if the temperature falls below this

    /*** when to stop and serialize the optimization (pick only one) ***/
    stopAfterTime:             99, // stop optimization after this many seconds
    stopAfterVariations:      1e5, // stop optimization after this many variations
    stopAfterScore:             0, // stop optimization if a measurement produces a score less than or equal to this
    stopAfterRounds:          1e3, // stop optimization after this many rounds have been exhausted

    // rankings to run, and the default importance of each ranking relative to the others
    yardsticks: {
        "Yardstick 1 Name":   3.2,
        "Another Yardstick":  1.7,
        "My Final Yardstick":  91,
        ...
    }
}
```

The `vary`, `save`, `html`, and `clone` functions are all invoked with the state as the `this` context, as well as
passing the state as a parameter. This allows you to use class instances for your states and supply methods that operate
on the instance, or write functions that take the state as a parameter. For example:

```js
class Route {
    constructor()      { /* ... */ }
    swapRandomCities() { /* ... */ }
    duplicate()        { /* ... */ }
    serialize(format)  { /* ... */ }
}
module.exports = {
    initial : () => new Route(),
    vary    : Route.prototype.swapRandomCities,
    clone   : Route.prototype.duplicate,
    save    : route => route.serialize('csv'),
    /* ... */
}
```

## Varying your States
When writing code to create a new state from another one it is important that you do NOT attempt to make the state
better in the process. If you do so, you are very likely to get stuck in a "local minimum", a spot where there is
no single "good" change your algorithm could make that would improve the state, yet if you made a handful of "bad"
changes first then you would be able to get to a far, far better state.

At its heart, the runtime takes the current state, varies it, measures the new variation, and compares the scores 
between the old state and the new variation. Based on the scores and the current temperature, it may decide to discard
the variation and keep what was the 'current' state. If your state is immutable—e.g. a number—then this is not a
problem. However, most complex states are represented by mutable objects. When your `vary` function changes the state
to produce a new state, it is also changing the _current_ state.

The `clone` function is required to combat this problem. If your states are immutable, do not specify a value for this.
If, however, your states _are_ mutable, then you must supply a `clone` function. This allows the runtime to duplicate
the current state before calling your `vary` function, and then decide which to keep.


## Writing Yardsticks
Yardsticks measure how bad a particular state for a particular desire. The ideal state would measure `0.0` on every yardstick.

Your scenario directory must have a `yardsticks` subdirectory with one or more modules in it, whose filenames
without the `.js` extension match the names supplied in your `yardsticks` description. If you have a file in the
directory, but the name is not mentioned in the scenario.js `yardsticks` map, that yardstick will not be run.

Yardstick modules must export a function that takes the current state as a parameter and returns an object with 1-2 keys:

* The **`score`** key is required, and must be a non-negative floating point number.
  The higher the score, the worse the state is according to this yardstick.

* The **`stats`** key is optional. It is used to provide insight into why the yardstick is producing its score.
  If present, `stats` must be an object with one or more keys. Each key is a label that will be displayed before the
  value as a string.

```js
// yardsticks/Distributed Speed.js
// Does each team have the same number of fast people?
module.exports = function(season) {
    const players = season.teams.map(t=>t.players.filter(p=>p.speedy).length);
    return {
        /* Multiply by 10 to bring it closer to other scores */
        score:players.standardDeviation() * 10,
        stats:{
            /* show a count of how many fast players each team has */
            "Speedy Players per Team":players.join(' ')
        }
    }
}
```


# Running via Command Line

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

* Rewrite asynchronous worker update to avoid [this problem](https://stackoverflow.com/questions/58425134/forcing-synchronous-node-js-ipc)
* Provide an option that resets the initial state without resetting weights or simulation parameters
* Finish Max Seeker example to have canvas-based graphical update
* Add an option to the UI to browse saved states and load them
* Graphs of best score vs current score


# History

* ...still awaiting an initial release...


# License & Contact

Rephinez is copyright ©2019 by Gavin Kistner and is licensed under the [MIT License](http://opensource.org/licenses/MIT). See the LICENSE file for more details.

For bugs or feature requests please open [issues on GitHub](https://github.com/Phrogz/rephinez/issues). For other communication you can [email the author](mailto:!@phrogz.net?subject=Rephinez) directly.
