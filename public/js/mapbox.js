/* eslint-disable */

const locations = JSON.parse(document.getElementById('map').dataset.locations);
//console.log('hello jerry')
mapboxgl.accessToken = 'pk.eyJ1IjoiamVycnlhdXN0cmlhIiwiYSI6ImNsZmM3ZDRpMDJzb2szeW50OWw4eHNzY3gifQ.t46Bq2aRl6uYMMqhxzoYhA';
    var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11'
});

