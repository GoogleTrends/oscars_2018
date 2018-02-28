import trailers from './trailers';

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
	player.cueVideoById(trailers[str]);
}

function init() {
	const tag = document.createElement('script');

	tag.src = 'https://www.youtube.com/iframe_api';
	const firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

export default { init, resize, changeMovie };
