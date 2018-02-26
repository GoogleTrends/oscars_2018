// D3 is included by globally by default
import * as topojson from 'topojson';
import { geoRobinson } from 'd3-geo-projection';
import colors from './colors';
import months from './months';
import trailers from './trailers';

const $map = d3.select('#month');
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
	const json = worldData.objects.countries_geo_github;
	const feature = topojson.feature(worldData, json);

	$g
		.selectAll('.region')
		.data(feature.features, d => d.id)
		.enter()
		.append('path')
		.at('d', path)
		.at('class', d => `region ${d.id}`);

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

function init({ world, year, month }) {
	updateDimensions();

	worldData = world;
	movieYearData = year;
	movieMonthData = month;

	createKey();
	setup();
	resize();
	update();
}

export default { init, resize };
