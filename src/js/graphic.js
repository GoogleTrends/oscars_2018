import graphicMap from './graphic-map';
import colors from './colors';

const movieColors = {};
let wordData = null;

const $map = d3.select('#map');
const $keyList = $map.select('.map__key ul');
const $graphic = $map.select('.map__graphic');
const $chart = $graphic.select('.graphic__chart');
const $info = $graphic.select('.graphic__info');
const $wordList = $info.select('.info__words ul');

function resize() {
	graphicMap.resize();
}

function handleKeyClick(datum, index) {
	$keyList.selectAll('li').st('background-color', (d, i) => {
		const c = d3.color(movieColors[d]);
		c.opacity = 0.5;
		return i === index ? c.toString() : 'transparent';
	});

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

function createMovieColors(data) {
	const nested = d3
		.nest()
		.key(d => d.max)
		.rollup(v => v.length)
		.entries(data);

	nested.sort((a, b) => d3.descending(a.value, b.value));

	nested.splice(0, 0, { key: 'All Films' });
	nested.forEach((d, i) => (movieColors[d.key] = colors.categorical[i]));
}

function createKey() {
	const data = Object.keys(movieColors);

	$keyList
		.selectAll('li')
		.data(data)
		.enter()
		.append('li')
		.text(d => d)
		.st('color', (d, i) => {
			const c = d3.color(movieColors[d]);
			return i === 0 ? colors.all : c.darker();
		})
		.st(
			'border-color',
			(d, i) => (i === 0 ? colors.all : d3.color(movieColors[d]))
		)
		.st('background-color', d => {
			const c = d3.color(movieColors[d]);
			c.opacity = 0.33;
			return c;
		})
		.on('click', handleKeyClick);
}

function cleanYear(data) {
	return data.map(d => ({
		...d,
		max: d.max.includes('Three') ? 'Three Billboards' : d.max
	}));
}

function cleanMonth(data) {
	const clean = data.map(d => ({
		...d,
		month: +d.month,
		max: d.country_max.includes('Three') ? 'Three Billboards' : d.country_max
	}));

	return d3
		.nest()
		.key(d => d.country)
		.entries(clean);
}

function cleanWords(data) {
	return d3
		.nest()
		.key(d => d.movie)
		.entries(data);
}

function join({ year, month }) {
	month.forEach(m => {
		const match = year.find(y => y.country === m.key);
		m.values.splice(0, 0, { month: 0, max: match.max });
	});
}

function init() {
	const path = 'assets/data';

	d3.loadData(
		`${path}/github_geototopo_v1.json`,
		`${path}/movies_by_year.csv`,
		`${path}/movies_by_month.csv`,
		`${path}/words.csv`,
		(err, response) => {
			const world = response[0];
			const year = cleanYear(response[1]);
			const month = cleanMonth(response[2]);
			wordData = cleanWords(response[3]);

			join({ year, month });

			createMovieColors(year);
			createKey();
			graphicMap.init({ world, month, movieColors });
		}
	);
}

export default { init, resize };
