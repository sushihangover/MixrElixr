<template>
    <div class="settings-section">
        <div class="settings-section-header">
            <span class="title">General</span>
        </div>
        <div class="settings-section-settings" style="padding-bottom: 0;">
        <div class="option-wrapper">

            <checkbox-toggle :value.sync="declutterTopBar" @changed="saveSettings()" label="Declutter The Top Navbar" tooltip="Condense nav links, simplify other buttons, and use the condensed Mixer logo"></checkbox-toggle>

            <checkbox-toggle :value.sync="showBadge" @changed="showBadgeChanged()" label="Currently Online Count Badge" tooltip="Whether or not you want the number of currently streaming friends displaying as a badge on the Elixr icon."></checkbox-toggle>
            
            <checkbox-toggle :value.sync="highlightFavorites" @changed="saveSettings()" label="Highlight Favorites" tooltip="Marks favorite streamers with green highlights while browsing Mixer."></checkbox-toggle>

            <div style="padding-bottom: 5px;" class="option-title">Favorite Streamers<option-tooltip name="favorite" title="Any streamers listed here will show up in the favorites list. If any favorite is streaming, the icon badge will be green instead of blue."></option-tooltip></div>
            <edittable-list class="option" :value.sync="favoriteFriends" :options="followingList" tag-placeholder="" placeholder="Search for or select a streamer" @changed="saveSettings()" @add-entry="favoriteAdded" @remove-entry="favoriteRemoved" :auto-close="true"></edittable-list>

            <span class="setting-subcategory">Live Desktop Notifications <option-tooltip name="liveNotifications" title="Settings for desktop notifications when people you follow go live."></option-tooltip></span>
            <div style="padding-bottom: 5px;" class="option-title">Enable Notifications For</div>
            <b-form-select v-model="liveNotificationsMode" :options="liveNotificationsModes" class="mb-3 option"></b-form-select>
            <checkbox-toggle :value.sync="playLiveNotificationSound" @changed="saveSettings()" label="Play Notification Sound"></checkbox-toggle>
        </div>
        </div>
    </div>
</template>

<script>
export default {
    mixins: [settingsStorage, friendFetcher],
    data() {
        let dataObj = {
            followingList: [],
            liveNotificationsModes: [
                { value: 'none', text: 'No one' },
                { value: 'favorites', text: 'Favorites only' },
                { value: 'all', text: 'All' }
            ]
        };

        //apply our defaults
        var defaults = this.getDefaultOptions().generalOptions;

        // fill out our model
        Object.keys(defaults).forEach((k) => {
            dataObj[k] = defaults[k];
        });

        return dataObj;
    },
    watch: {
        liveNotificationsMode: function() {
            this.saveSettings();
        },
    },
    methods: {
        showBadgeChanged: function() {
            bus.$emit('badge-change', this.showBadge);
            this.saveSettings();
        },
        favoriteAdded: function(name) {
            bus.$emit('add-favorite', name);
        },
        favoriteRemoved: function(name) {
            bus.$emit('remove-favorite', name);
        },
        saveSettings: function() {
            var model = this.getModel();
            this.saveGeneralOptions(model);
        },
        loadSettings: function() {
            var app = this;
            this.fetchSettings().then((data) => {
                app.setModel(data.generalOptions);
            });
        },
        setModel: function(options) {
            var app = this;
            Object.keys(options).forEach((k) => {
                app[k] = options[k];
            });
        },
        getModel: function() {
            var app = this;
            
            var builtModel = {};
            var options = this.getDefaultOptions().generalOptions;
            
            Object.keys(options).forEach((k) => {
                builtModel[k] = app[k];
            });

            return builtModel;
        },
    },
    mounted: function() {
        var app = this;

        app.loadSettings();
        app.outputMixerFollows(false).then((followList) => {
            app.followingList = followList.map(u => u.token);
        });

        bus.$on('favorites-updated', function(favList) {
            app.favoriteFriends = favList;
        });
    }
};
</script>