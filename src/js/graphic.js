import graphicMap from './graphic-map';
import colors from './colors';
import months from './months';

let movieTitles = null;
const movieColors = {};
let wordData = null;

const $map = d3.select('#map');
const $keyList = $map.select('.map__key ul');
const $timelineList = $map.select('.map__ui ul.timeline');
const $pastList = $map.select('.map__ui ul.past');
const $graphic = $map.select('.map__graphic');
const $info = $graphic.select('.graphic__info');
const $wordList = $info.select('.info__words ul');
const $control = $map.select('.ui__control');

function resize() {
	graphicMap.resize();
}

function handleControlClick() {
	const playing = $control.classed('is-playing');
	$control.classed('is-playing', !playing);
	$control.select('.play').classed('is-selected', playing);
	$control.select('.pause').classed('is-selected', !playing);
}

function handleKeyClick(datum, index) {
	graphicMap.changeMovie(datum);
	$keyList.selectAll('li').classed('is-selected', (d, i) => i === index);

	const filtered = wordData.find(d => d.key === datum);

	const $li = $wordList.selectAll('li').data(filtered.values);

	const big = 20;
	$li
		.enter()
		.append('li')
		.merge($li)
		.text(d => d.word)
		.st('font-size', (d, i) => big - i);
}

function handleTimelineClick(datum, index) {
	$timelineList.selectAll('li').classed('is-selected', (d, i) => i === index);
	$pastList.select('li').classed('is-selected', false);
	graphicMap.changeMonth(index + 1);
}

function handlePastClick() {
	$pastList.select('li').classed('is-selected', true);
	$timelineList.selectAll('li').classed('is-selected', false);
	graphicMap.changeMonth(0);
}

function createMovieColors(data) {
	const top = data.map(d => d.values[0].max);

	const nested = d3
		.nest()
		.key(d => d)
		.rollup(v => v.length)
		.entries(top);

	nested.sort((a, b) => d3.descending(a.value, b.value));

	nested.splice(0, 0, { key: 'All Films' });
	nested.forEach((d, i) => (movieColors[d.key] = colors.categorical[i]));
}

function createKey() {
	const data = Object.keys(movieColors);

	const $li = $keyList
		.selectAll('li')
		.data(data)
		.enter()
		.append('li');

	$li.append('span.bg').st('background-color', (d, i) => {
		const c = d3.color(movieColors[d]);
		c.opacity = 0.5;
		return c;
	});

	$li
		.append('span.fg')
		.text(d => d)
		.st('color', (d, i) => {
			const c = d3.color(movieColors[d]);
			return i === 0 ? colors.all : c.darker();
		})
		.st(
			'border-color',
			(d, i) => (i === 0 ? colors.all : d3.color(movieColors[d]))
		)
		.on('click', handleKeyClick);
}

function createTimeline() {
	const $li = $timelineList
		.selectAll('li')
		.data(months)
		.enter()
		.append('li')
		.on('click', handleTimelineClick);

	$li.append('p.label').text(d => d);
	$li.append('span.rect');

	$pastList.select('li').on('click', handlePastClick);
}

function cleanYear(data) {
	return data.map(d => {
		const out = {};
		const movieVals = movieTitles.map(c => ({
			title: c,
			value: +d[c]
		}));
		movieVals.forEach(m => {
			out[m.title] = m.value;
		});
		movieVals.sort((a, b) => d3.ascending(a.value, b.value));
		out.max = movieVals.pop().title;
		out.country = d.country;
		return out;
	});
}

function cleanMonth(data) {
	movieTitles = data.columns.filter(d => !['country', 'month'].includes(d));
	const clean = data.map(d => {
		const out = {};
		const movieVals = movieTitles.map(c => ({
			title: c,
			value: +d[c]
		}));
		movieVals.forEach(m => {
			out[m.title] = m.value;
		});
		movieVals.sort((a, b) => d3.ascending(a.value, b.value));
		out.max = movieVals.pop().title;
		out.country = d.country;
		out.month = +d.month;
		return out;
	});

	return d3
		.nest()
		.key(d => d.country)
		.entries(clean);
}

function cleanYearMax(data) {
	return data.map(d => ({
		...d,
		max: d.max.includes('Three') ? 'Three Billboards' : d.max
	}));
}

function cleanMonthMax(data) {
	return data.map(d => ({
		...d,
		month: +d.month,
		max: d.max.includes('Three') ? 'Three Billboards' : d.max
	}));
}

function cleanWords(data) {
	return d3
		.nest()
		.key(d => d.movie)
		.entries(data);
}

function join({ year, month, monthMax, yearMax }) {
	month.forEach(m => {
		// const match = year.find(y => y.country === m.key);

		m.values.forEach(v => {
			const monthMatch = monthMax.find(
				y => y.country === m.key && y.month === v.month
			);
			v.max = monthMatch.max;
		});

		const yearMatchMax = yearMax.find(y => y.country === m.key);

		const yearMatch = year.find(y => y.country === m.key);

		const yearObj = { month: 0, max: yearMatchMax.max };

		movieTitles.forEach(t => {
			yearObj[t] = yearMatch[t];
		});

		m.values.splice(0, 0, yearObj);
	});
}

function init() {
	const path = 'assets/data';

	d3.loadData(
		`${path}/all_countries_topo.json`,
		`${path}/movies_by_month--max.csv`,
		`${path}/movies_by_year--max.csv`,
		`${path}/movies_by_month--all.csv`,
		`${path}/movies_by_year--all.csv`,
		`${path}/words.csv`,
		(err, response) => {
			const world = response[0];
			const monthMax = cleanMonthMax(response[1]);
			const yearMax = cleanYearMax(response[2]);
			const month = cleanMonth(response[3]);
			const year = cleanYear(response[4]);
			wordData = cleanWords(response[5]);

			join({ year, month, monthMax, yearMax });

			createMovieColors(month);
			createKey();
			createTimeline();
			$control.on('click', handleControlClick);
			graphicMap.init({ world, month, movieColors });
		}
	);
}

export default { init, resize };
