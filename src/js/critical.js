import Promise from 'promise-polyfill';
import './polyfills/startsWith';
import './polyfills/endsWith';
import './polyfills/findIndex';
import './polyfills/find';
import './polyfills/includes';

// polyfill promise
if (!window.Promise) window.Promise = Promise;

