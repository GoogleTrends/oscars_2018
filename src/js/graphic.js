// D3 is included by globally by default
import * as topojson from 'topojson';
import { geoRobinson } from 'd3-geo-projection';
import colors from './colors';
import months from './months';

const TEST = false;

const $map = d3.select('#map');
const $uiLabel = $map.select('.ui__label');
const $svg = $map.select('svg');
const $g = $svg.select('g');

const BP = 800;
let width = 0;
let height = 0;
let mobile = false;
let worldData = null;
let movieYearData = null;
let movieMonthData = null;
let currentMonth = 1;
const movieColors = {};

function getMovieColor({ properties }) {
	const { name } = properties;
	const country = movieMonthData.find(d => d.key === name);
	if (!country) return colors.default;

	const m = country.values.find(d => d.month === currentMonth);
	return movieColors[m.country_max];
}

function update() {
	$g.selectAll('.region').st('fill', getMovieColor);
}

function handleSlider() {
	currentMonth = +this.value;
	const m = months[currentMonth - 1];
	$uiLabel.text(`${m} 2017`);
	update();
}

function createKey() {
	const nested = d3
		.nest()
		.key(d => d.max)
		.rollup(v => v.length)
		.entries(movieYearData);

	nested.sort((a, b) => d3.descending(a.value, b.value));

	nested.forEach((d, i) => (movieColors[d.key] = colors.categorical[i]));

	const movieColorsArr = Object.keys(movieColors);
	$map
		.select('.map__key ul')
		.selectAll('li')
		.data(movieColorsArr)
		.enter()
		.append('li')
		.text(d => d)
		.st('color', d => movieColors[d]);
}

function setup() {
	const projection = geoRobinson()
		// .scale(1)
		.translate([width / 2, height / 2]);

	const path = d3.geoPath().projection(projection);
	const prop = TEST ? 'countries' : 'countries_geo_github';
	const json = worldData.objects[prop];
	const feature = topojson.feature(worldData, json);

	$g
		.selectAll('.region')
		.data(feature.features, d => d.id)
		.enter()
		.append('path')
		.at('d', path)
		.at('class', d => `region ${d.id}`);

	createKey();
	$map.select('.slider').on('input', handleSlider);
}

function updateDimensions() {
	width = $map.node().offsetWidth;

	mobile = width < BP;
	// const ratio = 1
	// const h = w * ratio

	height = window.innerHeight * 0.67;
}

function resize() {
	updateDimensions();
	$svg.at({ width, height });
}

function cleanMovieMonthData(data) {
	const clean = data.map(d => ({
		...d,
		month: +d.month
	}));

	return d3
		.nest()
		.key(d => d.country)
		.entries(clean);
}

function init() {
	const path = 'assets/data';
	const geo = TEST ? 'world-110m' : 'github_geototopo_v1';
	updateDimensions();

	d3.loadData(
		`${path}/${geo}.json`,
		`${path}/movies_by_year.csv`,
		`${path}/movies_by_month.csv`,
		(err, response) => {
			worldData = response[0];
			movieYearData = response[1];
			movieMonthData = cleanMovieMonthData(response[2]);
			setup();
			resize();
			update();
		}
	);
}

export default { init, resize };
