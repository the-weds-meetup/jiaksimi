var main = new Vue({
    el: '#main',
    data: {
        venues: [],

        // developers
        limit: 4,

        // required for foursquare apis
        currentPos: default_location,
        radius: 500,
        user_tags: [],
        default_tag: '4d4b7105d754a06374d81259',

        // filters
        filter_distance_list: [50, 100, 500, 1000],
        system_tags: [],

        // booleans
        is_venue_loaded: false,
        is_user_login: false,
        is_filter_card_active: false,

    },
    mounted: async function () {
        await this.getUserInfo();
        await this.getCurrentLocation()
            .then(position => {
                this.currentPos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                }
            }).catch(error => {
                console.log(error);
                console.log("An error occured. Using defaults");
            })

        await this.getVenues();
        
    },

    methods: {
        // get location of the browser using the geolocation
        // returns a promise containing the coordinates
        getCurrentLocation: async function() {
            var options = {
                enableHighAccuracy: true,
                timeout:15000,
                maximumAge:30000,
            }

            if (navigator.geolocation) {
                return new Promise(function (resolve, reject) {
                    navigator.geolocation.getCurrentPosition(resolve, reject, options)
                });
            } else {
                return new Promise.reject(new Error("Browser does not support geolocation"));
            }
        },

        // call foursquare api and update venues
        getVenues: async function() {
            var fetch_venue = [];
            var user_tags = this.user_tags.length == 0 ? [this.default_tag] : this.user_tags;
            const url = `https://api.foursquare.com/v2/venues/search?client_id=${foursquare.client_id}&client_secret=${foursquare.client_secret}&v=20201020&ll=${this.currentPos.lat},${this.currentPos.lng}&radius=${this.radius}&limit=${this.limit}&categoryId=${user_tags.toString()}`;

            // loop through get important data & image
            var venues = await axios.get(url)
                .then(response => {
                    return response.data.response.venues;  
                });
           
            // get images
            for (const venue of venues) {
                const url_venue_details = `https://api.foursquare.com/v2/venues/${venue.id}?client_id=${foursquare.client_id}&client_secret=${foursquare.client_secret}&v=20200928`
                var photo = await axios.get(url_venue_details)
                    .then(response => {
                        var photo_raw = response.data.response.venue.bestPhoto;
                        return photo_raw.prefix + 'cap300' + photo_raw.suffix;
                    });

                // push to array
                fetch_venue.push({
                    id: venue.id,
                    name: venue.name,
                    distance: venue.location.distance,
                    photo: photo,
                    url: `./map.html?id=${venue.id}&distance=${venue.location.distance}&lat=${this.currentPos.lat}&lng=${this.currentPos.lng}`,
                });
            }
            this.venues = fetch_venue;
            this.is_venue_loaded = true;
        },

        // calls the DB and determines if user is login or not
        // if login, fill up the user details
        getUserInfo: async function() {
            await axios.get('../server/api/get-user-details.php')
                .then((res => {
                    var user = res.data; 
                    this.is_user_login = true;
                    this.radius = user.filter.distance != 0 ? user.filter.distance : this.radius;
                    this.user_tags = user.filter.tags;
                }))
                .catch(err => { console.log(err); });
        },

        // fetches all available tags in the server
        getAllTags: async function() {
            await axios.get('../server/api/get-tags.php')
                .then(res => this.system_tags = res.data.records)
                .catch(err => { console.log(err);});
        }
    }
});