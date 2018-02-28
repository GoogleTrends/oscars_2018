// D3 is included by globally by default
import * as topojson from 'topojson';
import { geoRobinson } from 'd3-geo-projection';
import colors from './colors';

const $map = d3.select('#map');
const $graphic = $map.select('.map__graphic');
const $chart = $graphic.select('.graphic__chart');
const $svg = $chart.select('svg');
const $g = $svg.select('g');

const BP = 800;
const SECOND = 1000;
const EASE = d3.easeCubicInOut;
const scaleOpacity = d3.scaleLinear();
let width = 0;
let height = 0;
let mobile = false;
let worldData = null;
let movieMonthData = null;

let worldFeature = null;
let projection = null;
let path = null;
let currentMonth = 0;
let currentMovie = null;
let active = d3.select(null);

let colorDict = null;
let ready = false;

const zoom = d3.zoom().scaleExtent([1, 5]);

function getMovieFill({ properties }) {
	// heatmap
	if (currentMovie) return colorDict[currentMovie];

	// comparison
	const { NAME_0 } = properties;
	const country = movieMonthData.find(d => d.key === NAME_0);
	if (!country) return colors.default;

	const m = country.values.find(d => d.month === currentMonth);
	return colorDict[m.max];
}

function getMovieOpacity({ properties }) {
	// comparison
	if (!currentMovie) return 1;

	// heatmap
	const { NAME_0 } = properties;
	const country = movieMonthData.find(d => d.key === NAME_0);
	if (!country) return colors.default;

	const m = country.values.find(d => d.month === currentMonth);
	return scaleOpacity(m[currentMovie]);
}

function updateScale() {
	console.log(currentMonth, currentMovie);
	console.log(movieMonthData);
	const vals = movieMonthData.map(d => d.values[currentMonth][currentMovie]);
	scaleOpacity.domain([0, d3.max(vals)]);
}

function update() {
	// TODO update opacity scale
	if (currentMovie) updateScale();
	console.log(scaleOpacity.domain());
	$g
		.selectAll('.region')
		.st('fill', getMovieFill)
		.st('fill-opacity', getMovieOpacity)
		.at('d', path);
}

function resetZoom() {
	active.classed('is-active', false);
	active = d3.select(null);

	// const bounds = path.bounds($g);
	// const dx = bounds[1][0] - bounds[0][0];
	// const dy = bounds[1][1] - bounds[0][1];
	// const x = (bounds[0][0] + bounds[1][0]) / 2;
	// const y = (bounds[0][1] + bounds[1][1]) / 2;

	// const scale = Math.max(
	// 	1,
	// 	Math.min(8, 0.9 / Math.max(dx / width, dy / height))
	// );
	// const translateX = width / 2 - scale * x;
	// const translateY = height / 2 - scale * y;

	// const zoomTransform = d3.zoomIdentity
	// 	.translate(translateX, translateY)
	// 	.scale(scale);

	// $g
	// 	.transition()
	// 	.duration(SECOND)
	// 	.ease(EASE)
	// 	.call(zoom.transform, zoomTransform);

	$g
		.transition()
		.duration(SECOND)
		.ease(EASE)
		.call(zoom.transform, d3.zoomIdentity);

	// $svg
	// 	.transition()
	// 	.call(zoom.translate([width / 2, height / 2]).scale(1).event);
}

function handleZoom() {
	const ratio = 1 / d3.event.transform.k * 0.5;

	$g.at('transform', d3.event.transform);

	$g.selectAll('.region').st('stroke-width', `${ratio}px`);
}

function handleRegionClick(d) {
	if (active.node() === this) return resetZoom();
	active.classed('active', false);
	active = d3.select(this).classed('active', true);

	console.log(d);
	const bounds = path.bounds(d);
	const dx = bounds[1][0] - bounds[0][0];
	const dy = bounds[1][1] - bounds[0][1];
	const x = (bounds[0][0] + bounds[1][0]) / 2;
	const y = (bounds[0][1] + bounds[1][1]) / 2;

	const scale = Math.max(
		1,
		Math.min(8, 0.9 / Math.max(dx / width, dy / height))
	);
	const translateX = width / 2 - scale * x;
	const translateY = height / 2 - scale * y;

	const zoomTransform = d3.zoomIdentity
		.translate(translateX, translateY)
		.scale(scale);

	$g
		.transition()
		.duration(SECOND)
		.ease(EASE)
		.call(zoom.transform, zoomTransform);
}

function handleRegionEnter(d) {
	console.log(d);
}

function setup() {
	const json = worldData.objects.all_countries;
	worldFeature = topojson.feature(worldData, json);

	projection = geoRobinson()
		.translate([width / 2, height / 2])
		.fitSize([width, height], worldFeature);

	path = d3.geoPath().projection(projection);

	console.log(worldFeature.features);
	$g
		.selectAll('.region')
		.data(worldFeature.features, d => d.id)
		.enter()
		.append('path')

		.at('class', d => `region ${d.id}`)
		.on('click', handleRegionClick)
		.on('mouseenter', handleRegionEnter);

	ready = true;
	zoom.on('zoom', handleZoom);

	resetZoom();
}

function updateDimensions() {
	width = $graphic.node().offsetWidth;

	mobile = width < BP;
	const ratio = 2;
	height = Math.floor(width / ratio);
}

function resize() {
	updateDimensions();
	$svg.at({ width, height });
	$chart.at({ width, height });
	projection
		.translate([width / 2, height / 2])
		.fitSize([width, height], worldFeature);
	path = d3.geoPath().projection(projection);
	if (ready) update();
}

function changeMonth(i) {
	if (isNaN(i)) {
		currentMonth += 1;
		currentMonth = currentMonth > 12 ? 1 : currentMonth;
	} else currentMonth = i;

	update();
}

function getMonth() {
	return currentMonth;
}

function changeMovie(str) {
	currentMovie = str === 'All Films' ? null : str;
	update();
}

function init({ world, month, movieColors }) {
	updateDimensions();

	colorDict = movieColors;
	worldData = world;
	movieMonthData = month;

	setup();
	resize();
}

export default { init, resize, changeMonth, changeMovie, getMonth };
