import graphicMap from './graphic-map';
import graphicVideo from './graphic-video';
import colors from './colors';
import months from './months';

const SECOND = 1000;
const movieColors = {};
let movieTitles = null;
let wordData = null;

const $map = d3.select('#map');
const $keyList = $map.select('.map__key ul');
const $timelineList = $map.select('.map__ui ul.timeline');
const $pastList = $map.select('.map__ui ul.past');
const $graphic = $map.select('.map__graphic');
const $info = $graphic.select('.graphic__info');
const $wordList = $info.select('.info__words ul');
const $control = $map.select('.ui__control');
const $infoToggle = $info.select('.info__toggle');
const $trailerTitle = $map.select('.info__words p span');

let timer = null;
let currentWordIndex = 0;
let wordTimer = null;

function resize() {
	graphicMap.resize();
}

function updateWords(datum) {
	graphicVideo.changeMovie(datum);
	$trailerTitle.st('color', d3.color(movieColors[datum]).darker(0.5));
	const filtered = wordData.find(d => d.key === datum);

	const $li = $wordList.selectAll('li').data(filtered.values.slice(0, 5));

	const big = 20;
	const $enter = $li.enter().append('li');

	$enter.append('span');

	$li
		.merge($enter)
		.select('span')
		.text(d => d.word)
		.st('font-size', (d, i) => big - i * 2)
		.st('color', d3.color(movieColors[datum]).darker(0.5));
}

function handleInfoToggleClick() {
	const hidden = $info.classed('is-hidden');
	const t = hidden ? 'hide' : 'show details';
	$infoToggle.select('p').text(t);
	$info.classed('is-hidden', !hidden);
}

function animate() {
	graphicMap.changeMonth();
	const m = graphicMap.getMonth() - 1;
	$timelineList.selectAll('li').classed('is-selected', (d, i) => i === m);
	timer = setTimeout(animate, SECOND);
}

function handleControlClick() {
	const playing = $control.classed('is-playing');
	$control.classed('is-playing', !playing);
	$control.select('.play').classed('is-selected', playing);
	$control.select('.pause').classed('is-selected', !playing);

	if (playing) {
		if (timer) clearTimeout(timer);
	} else {
		// if on 2017, set to jan
		$pastList.select('li').classed('is-selected', false);
		if (timer) clearTimeout(timer);
		if (graphicMap.getMonth() === 0) {
			graphicMap.changeMonth(1);
			$timelineList.selectAll('li').classed('is-selected', (d, i) => i === 0);
		}

		timer = setTimeout(animate, SECOND);
	}
}

function shuffle() {
	currentWordIndex += 1;
	if (currentWordIndex >= movieTitles.length) currentWordIndex = 0;

	updateWords(movieTitles[currentWordIndex]);
	wordTimer = setTimeout(shuffle, SECOND * 5);
}

function handleKeyClick(datum, index) {
	graphicMap.changeMovie(datum);
	$keyList.selectAll('li').classed('is-selected', (d, i) => i === index);
	clearTimeout(wordTimer);
	if (datum !== 'All Films') updateWords(datum);
	else shuffle();
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
	if (timer) clearTimeout(timer);
	timer = null;
}

function createMovieColors(data) {
	const top = data.map(d => d.values[0].max).filter(d => d);

	const nested = d3
		.nest()
		.key(d => d)
		.rollup(v => v.length)
		.entries(top);

	nested.sort((a, b) => d3.descending(a.value, b.value));

	nested.splice(0, 0, { key: 'All Films' });
	nested.push({ key: 'The Post', value: 0 });
	nested.forEach((d, i) => (movieColors[d.key] = colors.categorical[i]));
}

function createKey() {
	// console.log(movieTitles, movieColors);
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

function cleanMax(str) {
	if (str.includes('Three')) return 'Three Billboards';
	else if (str === 'insufficient_data') return null;
	return str;
}

function cleanWords(data) {
	return d3
		.nest()
		.key(d => d.movie)
		.entries(data);
}

function cleanData(data) {
	// console.log(data);
	movieTitles = data.columns.filter(
		d => !['fullname', 'max', 'month'].includes(d)
	);
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
		out.fullname = d.fullname;
		out.month = +d.month;
		out.max = cleanMax(d.max);
		return out;
	});

	return d3
		.nest()
		.key(d => d.fullname)
		.entries(clean);
}

function init() {
	const w = d3.select('main').node().offsetWidth;
	const mob = w < 640;
	$info.classed('is-hidden', mob);
	$infoToggle.select('p').text(mob ? 'Show details' : 'Hide');
	const path = 'assets/data';

	d3.loadData(
		`${path}/all_countries_topo.json`,
		`${path}/all_data.csv`,
		// `${path}/movies_by_month--max.csv`,
		// `${path}/movies_by_year--max.csv`,
		// `${path}/movies_by_month--all.csv`,
		// `${path}/movies_by_year--all.csv`,
		`${path}/words.csv`,
		(err, response) => {
			const world = response[0];

			const allData = cleanData(response[1]);
			wordData = cleanWords(response[2]);

			createMovieColors(allData);
			createKey();
			createTimeline();
			$control.on('click', handleControlClick);
			$infoToggle.on('click', handleInfoToggleClick);
			graphicMap.init({ world, allData, movieColors });
			graphicVideo.init();
			shuffle();
			$info.classed('is-visible', true);
			$map.classed('is-visible', true);
		}
	);
}

export default { init, resize };
