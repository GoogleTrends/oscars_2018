import trailers from './trailers';

const $map = d3.select('#map');
const $trailerA = $map.select('.info__trailer a');
const $trailerImg = $map.select('.info__trailer img');
const $trailerTitle = $map.select('.info__words p span');

let player;

function onPlayerReady(event) {}

function onPlayerStateChange(event) {}

function stopVideo() {
	player.stopVideo();
}

function resize() {}

window.onYouTubeIframeAPIReady = function() {
	player = new YT.Player('youtube-player', {
		height: '200',
		width: '240',
		videoId: trailers.Dunkirk,
		events: {
			onReady: onPlayerReady,
			onStateChange: onPlayerStateChange
		}
	});
};

function changeMovie(str) {
	// player.cueVideoById(trailers[str]);
	const t = str.toLowerCase().replace(/ /g, '');
	const src = `assets/img/${t}@2x.jpg`;

	$trailerImg.at({ src });

	const href = `https://www.youtube.com/watch?v=${trailers[str]}`;
	$trailerA.at({ href });

	$trailerTitle.text(str);
}

function init() {
	// const tag = document.createElement('script');
	// tag.src = 'https://www.youtube.com/iframe_api';
	// const firstScriptTag = document.getElementsByTagName('script')[0];
	// firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

export default { init, resize, changeMovie };
