// D3 is included by globally by default
import * as topojson from 'topojson';
import { geoRobinson } from 'd3-geo-projection';
import colors from './colors';

const $map = d3.select('#map');
const $graphic = $map.select('.map__graphic');
const $chart = $graphic.select('.graphic__chart');
const $svg = $chart.select('svg');
const $g = $svg.select('g');
const $tooltip = $chart.select('.tooltip');

const BP = 800;
const SECOND = 1000;
const EASE = d3.easeCubicInOut;
const scaleOpacity = d3.scaleLinear().range([0.1, 1]);
let width = 0;
let height = 0;
let mobile = false;
let worldData = null;
let movieData = null;

let worldFeature = null;
let projection = null;
let path = null;
let currentMonth = 0;
let currentMovie = null;
let active = d3.select(null);

let colorDict = null;
let ready = false;

let zoomedIn = false;
let maxZoom = 5;

let tooltipData = null;
const showTip = !d3.select('body').classed('is-mobile');

const zoom = d3.zoom().scaleExtent([1, 5]);

const RECT_SIZE = 10;

function getMovieFill({ data }) {
	if (!data) return colors.default;
	// heatmap
	if (currentMovie) return colorDict[currentMovie];

	// comparison
	const m = data.find(d => d.month === currentMonth);
	if (!m) return colors.default;
	return m.max ? colorDict[m.max] : colors.default;
}

function getMovieOpacity({ data }) {
	if (!data) return 0;
	// comparison
	if (!currentMovie) return 1;

	// heatmap
	const m = data.find(d => d.month === currentMonth);
	if (!m) return 0;
	return m[currentMovie] ? scaleOpacity(m[currentMovie]) : 0;
}

function updateScale() {
	const vals = movieData.map(d => d.values[currentMonth][currentMovie]);
	scaleOpacity.domain([0, d3.max(vals)]);
}

function update() {
	// TODO update opacity scale
	if (currentMovie) updateScale();
	$g
		.selectAll('.region')
		.st('fill', getMovieFill)
		.st('fill-opacity', getMovieOpacity)
		.at('d', path);

	updateTipData();
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

function handleMapClick() {
	const [x, y] = d3.mouse(this);
	zoomedIn = !zoomedIn;
	if (zoomedIn) resetZoom();
	else {
		const scale = maxZoom;
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
}

function handleRegionClick(d) {
	if (active.node() === this) return resetZoom();
	active.classed('active', false);
	active = d3.select(this).classed('active', true);

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

function updateTipData() {
	if (tooltipData) {
		const { data } = tooltipData;
		const col = currentMovie || 'max';
		const movie = data[currentMonth][col] || 'N/A';
		const display = currentMovie || movie;
		$tooltip.select('.movie').text(display);
	}
}

function handleRegionEnter(d) {
	tooltipData = d;
	$tooltip.classed('is-visible', showTip);
	const { NAME_0, NAME_1 } = d.properties;
	const { data } = d;
	const name = `${NAME_1}, ${NAME_0}`;
	const col = currentMovie || 'max';
	const movie = data[currentMonth][col] || 'N/A';
	const display = currentMovie || movie;
	$tooltip.select('.name').text(name);
	$tooltip.select('.movie').text(display);
	d3
		.select(this)
		.classed('is-highlight', true)
		.raise();
}

function handleRegionExit() {
	tooltipData = null;
	$tooltip.classed('is-visible', false);
	d3.select(this).classed('is-highlight', false);
}

function handleMove() {
	const [x, y] = d3.mouse(this);
	const top = y < height / 2 ? y + 12 : 'auto';
	const bottom = y >= height / 2 ? height - y + 12 : 'auto';
	const left = x < width / 2 ? x + 12 : 'auto';
	const right = x >= width / 2 ? width - x + 12 : 'auto';
	$tooltip.st({ top, right, bottom, left });
}

function setup() {
	const json = worldData.objects.all_countries;
	worldFeature = topojson.feature(worldData, json);

	projection = geoRobinson()
		.translate([width / 2, height / 2])
		.fitSize([width, height], worldFeature);

	path = d3.geoPath().projection(projection);

	worldFeature.features.forEach(f => {
		const { NAME_0, NAME_1 } = f.properties;
		const match = movieData.find(d => d.key === `${NAME_0}${NAME_1}`);
		f.data = match ? match.values : null;
	});
	$g
		.selectAll('.region')
		.data(worldFeature.features, d => d.id)
		.enter()
		.append('path')

		.at('class', d => `region ${d.id}`)
		.on('mouseenter', handleRegionEnter)
		.on('mouseout', handleRegionExit);
	// .on('click', handleRegionClick)

	$svg.on('click', handleMapClick).on('mousemove', handleMove);

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
	maxZoom = 6;
	if (ready) update();

	$svg
		.select('.key')
		.at('transform', `translate(${width - 56}, ${height * 0.33})`);
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

	if (currentMovie) {
		$svg
			.select('.key')
			.selectAll('rect')
			.st('fill', colorDict[currentMovie])
			.st('fill-opacity', d => {
				const max = scaleOpacity.domain()[1];
				return scaleOpacity(max * (1 - d));
			});
	}
	$svg.select('.key').classed('is-visible', !!currentMovie);
}

function createKey() {
	const $key = $svg.append('g.key');
	const data = d3.range(5).map(d => d / 4);
	$key
		.append('text.search')
		.text('Search')
		.at('text-anchor', 'middle')
		.at('y', 0);
	$key
		.append('text.popularity')
		.text('Popularity')
		.at('text-anchor', 'middle')
		.at('y', 14);
	$key
		.append('text.more')
		.text('More')
		.at('text-anchor', 'start')
		.at('y', 40)
		.at('x', RECT_SIZE + 4);
	$key
		.append('text.less')
		.text('Less')
		.at('text-anchor', 'start')
		.at('y', RECT_SIZE * data.length + 28)
		.at('x', RECT_SIZE + 4);
	$key
		.selectAll('rect')
		.data(data)
		.enter()
		.append('rect')
		.at({
			x: 0,
			y: 0,
			width: RECT_SIZE,
			height: RECT_SIZE
		})
		.at('transform', (d, i) => `translate(0, ${28 + i * RECT_SIZE})`);
}
function init({ world, allData, movieColors }) {
	updateDimensions();

	colorDict = movieColors;
	worldData = world;
	movieData = allData;
	setup();
	createKey();
	resize();
}

export default { init, resize, changeMonth, changeMovie, getMonth };
