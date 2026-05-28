const {Schedule, buildInitialSchedule} = require('./utils')

// 8 regular-season Mondays from June 1 through Aug 3, 2026.
// June 29 and July 6 are skipped. Aug 10 is the tournament (not scheduled here).
const DATES = [
	'Jun 1',  'Jun 8',  'Jun 15', 'Jun 22',
	'Jul 13', 'Jul 20', 'Jul 27', 'Aug 3',
]

// ISO dates aligned with DATES, used for the TopScore CSV export (mm/dd/yyyy).
const ISO_DATES = [
	'2026-06-01', '2026-06-08', '2026-06-15', '2026-06-22',
	'2026-07-13', '2026-07-20', '2026-07-27', '2026-08-03',
]

const TIMES = ['5:45pm', '7:15pm']

// HH:MM 24-hour values aligned with TIMES (start, end). Each game is ~75min,
// with a 15-minute gap between the two slots.
const TIMES_24 = [
	{start:'17:45', end:'19:00'},
	{start:'19:15', end:'20:30'},
]

// Terse team labels used during optimization & in the HTML view.
const TEAM_NAMES = Array.from({length:8}, (_,i) => `T${i+1}`)

// Long team names for the CSV export to TopScore / Ultimate Central.
const TEAM_NAMES_LONG = Array.from({length:8}, (_,i) => `Team ${String(i+1).padStart(2,'0')}`)

const LOCATION_NAME = 'Pleasant View Soccer Complex'
const FIELD_NAMES = ['B1', 'B2', 'B3', 'B4']

const META = {
	dates:      DATES,
	times:      TIMES,
	teamNames:  TEAM_NAMES,
	fieldNames: FIELD_NAMES,
}

function makeInitial() {
	return buildInitialSchedule({
		numTeams:  TEAM_NAMES.length,
		numFields: FIELD_NAMES.length,
		numSlots:  TIMES.length,
		numRounds: DATES.length,
		meta:      META,
	})
}

function htmlEscape(s) {
	return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}

function stddev(a) {
	const avg = a.reduce((x,y)=>x+y,0)/a.length
	return Math.sqrt(a.reduce((x,y)=>x+(y-avg)**2,0)/a.length)
}

function scheduleHtml(schedule) {
	const {games, dates, times, teamNames, fieldNames, numTeams, numFields, numRounds, numSlots} = schedule

	// --- Schedule grid (rounds x slots rows, fields columns) ---
	let scheduleRows = ''
	for (let r=0; r<numRounds; ++r) {
		for (let s=0; s<numSlots; ++s) {
			const label = `${dates[r]} ${times[s]}`
			let row = `<tr class="r${r} s${s}${s===0?' first-slot':''}"><th class="slot-label">${htmlEscape(label)}</th>`
			for (let f=0; f<numFields; ++f) {
				const g = games[r][s][f]
				const cell = g
					? `${htmlEscape(teamNames[g[0]])} <span class="vs">vs</span> ${htmlEscape(teamNames[g[1]])}`
					: '&mdash;'
				row += `<td class="f${f}"><div class="game">${cell}</div></td>`
			}
			row += '</tr>'
			scheduleRows += row
		}
	}
	const fieldHeaders = fieldNames.map(n => `<th>${htmlEscape(n)}</th>`).join('')
	const scheduleTable =
		`<table id="schedule">
			<thead><tr><th class="corner"></th>${fieldHeaders}</tr></thead>
			<tbody>${scheduleRows}</tbody>
		</table>`

	const teamHeaders = teamNames.map(n => `<th>${htmlEscape(n)}</th>`).join('')

	// --- Stats: games by field & team ---
	const fieldCounts = schedule.teamFieldCounts() // [team][field]
	let fbtRows = ''
	for (let f=0; f<numFields; ++f) {
		fbtRows += `<tr><th>${htmlEscape(fieldNames[f])}</th>`
		for (let t=0; t<numTeams; ++t) fbtRows += `<td>${fieldCounts[t][f]}</td>`
		fbtRows += '</tr>'
	}
	let fbtFootRow = '<tr><th>&sigma;</th>'
	for (let t=0; t<numTeams; ++t) fbtFootRow += `<td>${stddev(fieldCounts[t]).toFixed(2)}</td>`
	fbtFootRow += '</tr>'
	const fieldsByTeamTable =
		`<table class="statgrid">
			<caption>Games, by Field &amp; Team</caption>
			<thead><tr><th></th>${teamHeaders}</tr></thead>
			<tbody>${fbtRows}</tbody>
			<tfoot>${fbtFootRow}</tfoot>
		</table>`

	// --- Stats: teams played by team ---
	const matchups = schedule.matchupCounts() // [t1][t2]
	let mRows = ''
	for (let t1=0; t1<numTeams; ++t1) {
		mRows += `<tr><th>${htmlEscape(teamNames[t1])}</th>`
		for (let t2=0; t2<numTeams; ++t2) {
			const v = matchups[t1][t2]
			if (t1===t2) mRows += `<td class="diag">&middot;</td>`
			else mRows += `<td>${v||'-'}</td>`
		}
		mRows += '</tr>'
	}
	const teamsByTeamTable =
		`<table class="statgrid">
			<caption>Teams Played, by Team</caption>
			<thead><tr><th></th>${teamHeaders}</tr></thead>
			<tbody>${mRows}</tbody>
		</table>`

	// --- Stats: walking distance per team per week ---
	// Rows = teams, columns = weeks, plus a final "Total" column.
	const walkByTeam = schedule.walkingDistanceByTeam() // [team][round]
	const dateHeaders = dates.map(d => `<th>${htmlEscape(d)}</th>`).join('')
	let walkRows = ''
	const seasonTotals = []
	for (let t=0; t<numTeams; ++t) {
		walkRows += `<tr><th>${htmlEscape(teamNames[t])}</th>`
		for (let r=0; r<numRounds; ++r) {
			const v = walkByTeam[t][r]
			walkRows += `<td>${v || '-'}</td>`
		}
		const total = walkByTeam[t].reduce((a,b)=>a+b,0)
		seasonTotals.push(total)
		walkRows += `<td class="total">${total}</td></tr>`
	}
	const walkTable =
		`<table class="statgrid">
			<caption>Walking Distance per Team per Week (fields crossed)</caption>
			<thead><tr><th></th>${dateHeaders}<th>Total</th></tr></thead>
			<tbody>${walkRows}</tbody>
		</table>`

	const style = `<style>
		#mfsl-wrap { font-family: 'Trebuchet MS', sans-serif; }
		#mfsl-wrap table#schedule { border-collapse:collapse; margin:1em 0; border:1px solid #888; background:white; }
		#mfsl-wrap table#schedule th, #mfsl-wrap table#schedule td { border:1px solid #ccc; padding:0.2em 0.6em; text-align:center; }
		#mfsl-wrap table#schedule thead th { background:#eee; font-weight:normal; }
		#mfsl-wrap table#schedule tbody th.slot-label { background:#eee; font-weight:normal; text-align:right; white-space:nowrap; }
		#mfsl-wrap table#schedule tr.first-slot th.slot-label,
		#mfsl-wrap table#schedule tr.first-slot td { border-top:2px solid #333; }
		#mfsl-wrap table#schedule .game { white-space:nowrap; padding:0.1em 0.3em; }
		#mfsl-wrap table#schedule .vs { color:#999; font-style:italic; padding:0 0.2em; }
		#mfsl-wrap .stats-wrap { display:flex; flex-wrap:wrap; gap:1em; margin-top:1em; }
		#mfsl-wrap table.statgrid { border-collapse:collapse; border:1px solid #ccc; background:#ffe; }
		#mfsl-wrap table.statgrid caption { background:#ddc; font-weight:bold; padding:0.2em 0.5em; border:1px solid #ccc; border-bottom:0; }
		#mfsl-wrap table.statgrid th, #mfsl-wrap table.statgrid td { padding:0.1em 0.5em; text-align:center; white-space:nowrap; }
		#mfsl-wrap table.statgrid thead th { background:#eed; border-bottom:1px solid #ccc; }
		#mfsl-wrap table.statgrid tbody th { background:#eed; text-align:right; }
		#mfsl-wrap table.statgrid tfoot th, #mfsl-wrap table.statgrid tfoot td { background:#eed; border-top:1px solid #999; font-weight:bold; }
		#mfsl-wrap table.statgrid td.diag { color:#bbb; }
		#mfsl-wrap table.statgrid td.total { font-weight:bold; background:#eed; }
	</style>`

	return `${style}<div id="mfsl-wrap">${scheduleTable}<div class="stats-wrap">${fieldsByTeamTable}${teamsByTeamTable}${walkTable}</div></div>`
}

// Inverse of scheduleCsv. Parses a TopScore-format CSV back into a Schedule
// using the scenario's known dates/times/fields/teams as the index lookup.
function csvToSchedule(csv) {
	const longToIndex = Object.fromEntries(TEAM_NAMES_LONG.map((n,i) => [n, i]))
	const fieldToIndex = Object.fromEntries(FIELD_NAMES.map((n,i) => [n, i]))
	const isoToRound = {}
	ISO_DATES.forEach((iso, r) => {
		const [y,m,d] = iso.split('-')
		isoToRound[`${m}/${d}/${y}`] = r
	})
	const startTimeToSlot = Object.fromEntries(TIMES_24.map((t,s) => [t.start, s]))

	const games = Array.from({length:DATES.length}, () =>
		Array.from({length:TIMES.length}, () =>
			Array(FIELD_NAMES.length).fill(null)))

	csv.split(/\r?\n/).forEach(line => {
		if (!line.trim()) return
		const [home, away, startDate, startTime, , , , fieldName] = line.split(',')
		const r = isoToRound[startDate]
		const s = startTimeToSlot[startTime]
		const f = fieldToIndex[fieldName]
		const t1 = longToIndex[home], t2 = longToIndex[away]
		if (r==null || s==null || f==null || t1==null || t2==null) return
		const pair = t1 < t2 ? [t1,t2] : [t2,t1]
		games[r][s][f] = pair
	})

	return new Schedule(games, META)
}

// Emits TopScore / Ultimate Central CSV upload format:
//   <home>,<away>,<start date>,<start time>,<end date>,<end time>,<field name>,<field number>
// https://help.ultimatecentral.com/support/solutions/articles/166892-schedule-upload-format
function scheduleCsv(schedule) {
	const {games, numRounds, numSlots, numFields} = schedule
	const rows = []
	for (let r=0; r<numRounds; ++r) {
		const iso = ISO_DATES[r]
		const [yyyy, mm, dd] = iso.split('-')
		const mdY = `${mm}/${dd}/${yyyy}`
		for (let s=0; s<numSlots; ++s) {
			const {start, end} = TIMES_24[s]
			for (let f=0; f<numFields; ++f) {
				const g = games[r][s][f]
				if (!g) continue
				const home = TEAM_NAMES_LONG[g[0]]
				const away = TEAM_NAMES_LONG[g[1]]
				rows.push([home, away, mdY, start, mdY, end, LOCATION_NAME, FIELD_NAMES[f]].join(','))
			}
		}
	}
	return rows.join('\n') + '\n'
}

module.exports = {
	name: 'Multi-field Sports League',

	initial: makeInitial,
	// Variations only ever change which FIELD a game is played on within
	// its existing slot. Matchups, week assignments, and slot assignments
	// are never altered, so the round-robin ordering is preserved.
	//   * 90% swapFieldsInSlot  -- swap two games' fields within one slot
	//   * 10% reverseSlot       -- reverse the field order in one slot,
	//                              jumping past 1-swap dead ends
	vary: function() {
		if (Math.random() < 0.10) return this.reverseSlot()
		return this.swapFieldsInSlot()
	},
	clone:   Schedule.prototype.clone,
	html:    function() { return scheduleHtml(this) },
	save:    s => ({content: scheduleCsv(s), type: 'csv'}),
	load:    csv => csvToSchedule(csv),

	tempStart:                15,
	tempFalloffVariations:    40,
	restartAfterVariations:  200,
	checkinAfterTime:          1,
	stopAfterTime:            30,
	acceptEqualScores:      true,    // wander across equal-score plateaus to escape local minima

	yardsticks: {
		"Field Balance":               2.0,
		"Field Moves":                 0.4,
		"Walking Fairness":            1.0,
		// "Even Matchups":              8, // disabled: current vary() never breaks this constraint
		// "Back-to-Back Repeats":      10,  // disabled: current vary() never breaks this constraint
		// "First-cycle Completeness":  50,  // disabled: current vary() never breaks this constraint
	},
}
