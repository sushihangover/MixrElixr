Vue.component('streamer-page-options', {
	template: `
		<div class="settings-section">
			<div class="settings-section-header">
				<span class="title">Streamer Page</span> <streamer-override-dropdown :overrideNames="overrideNames" 
						:selected="selected"
						@override-added="overrideAdded"
						@override-selected="overrideSelected"
						@override-deleted="overrideDeleted">
					</streamer-override-dropdown>
			</div>
			<div class="settings-section-settings">
				<span class="setting-subcategory">General</span>
				<checkbox-toggle :value.sync="autoCloseInteractive" @changed="saveSettings()" label="Auto close Interactive boards"></checkbox-toggle>
				<checkbox-toggle :value.sync="autoMute" @changed="saveSettings()" label="Auto Mute Streams"></checkbox-toggle>

				<span class="setting-subcategory">Chat</span>
				<checkbox-toggle :value.sync="separateChat" @changed="saveSettings()" label="Separate Chat Lines"></checkbox-toggle>
				<checkbox-toggle :value.sync="alternateChatBGColor" @changed="saveSettings()" label="Alternate Chat BG Color"></checkbox-toggle>
				<checkbox-toggle :value.sync="mentionChatBGColor" @changed="saveSettings()" label="Highlight User Mentions"></checkbox-toggle>
				<inline-img-toggle :value.sync="showImagesInline" @changed="saveSettings()"></inline-img-toggle>
				<div v-show="showImagesInline" class="option-wrapper suboption">
					<div style="padding-bottom: 5px;">Permitted User Roles for Inline Images</div>
					<b-form-select v-model="lowestUserRoleLinks" :options="userRoles" class="mb-3 option"></b-form-select>
					<div style="padding-bottom: 5px;">User {{inlineUsersIsWhitelist ? 'Whitelist' : 'Blacklist'}} for Inline Images</div>
					<edittable-list class="option" :value.sync="inlineImgUsers" :options="viewers" tag-placeholder="Press enter to add user" placeholder="Select or type to add" @changed="saveSettings()"></edittable-list>
					<checkbox-toggle :value.sync="inlineUsersIsWhitelist" @changed="saveSettings()" label="Is Whitelist"></checkbox-toggle>
				</div>
				<div class="option-wrapper">
					<div style="padding-bottom: 5px;">Ignored Users</div>
					<edittable-list class="option" :value.sync="ignoredUsers" :options="viewers" tag-placeholder="Press enter to add user" placeholder="Select or type to add" @changed="saveSettings()"></edittable-list>
				</div>
				
				<span class="setting-subcategory">Hosts</span>
				<checkbox-toggle :value.sync="autoForwardOnHost" @changed="saveSettings()" label="Redirect on Host" tooltip="If the channel you go to is hosting someone else, automatically get redirected to that streamer."></checkbox-toggle>
				<checkbox-toggle :value.sync="autoMuteOnHost" @changed="saveSettings()" label="Auto Mute Stream on Host"></checkbox-toggle>
			</div>
        </div>
	`,
	mixins: [settingsStorage, scriptCommunication],
	methods: {
		overrideSelected: function(name) {
			var selectedType = null;

			if(name === 'Global') {
				selectedType = name;
			} else {
				// search for a matching override case insensitive
				var match = this.getOverrideNames().filter((o) => {
					return o.toLowerCase() === name.toLowerCase();
				});
	
				if(match.length > 0) {
					selectedType = match[0];
				}
			}

			if(selectedType != null) {
				this.selected = selectedType;
				this.setModel(this.getSelectedOptions());
			}
		},
		overrideAdded: function(name) {
			this.selected = name;

			var defaults = this.getDefaultOptions().streamerPageOptions.global;
			
			var defaultsCopy = JSON.parse(JSON.stringify(defaults));

			this.overrides[name] = defaultsCopy;

			this.overrideNames = this.getOverrideNames();

			this.setModel(defaultsCopy);

			this.saveSettings();
		},
		overrideDeleted: function(name) {
			delete this.overrides[name];
			this.overrideNames = this.getOverrideNames();
			this.selectModel('Global');
			this.saveSettings();
		},
		selectModel: function(name) {
			this.selected = name;
			this.setModel(this.getSelectedOptions());
		},
		saveSettings: function() {
			var model = this.getModel();

			if(this.selected === 'Global') {
				this.global = model;
			} else {
				this.overrides[this.selected] = model;
			}
			
			this.saveStreamerPageOptions({
				global: this.global,
				overrides: this.overrides
			});
		},
		loadSettings: function() {
			var app = this;
			app.selected = 'Global';
			this.fetchSettings().then((data) => {
				var streamerPageOptions = data.streamerPageOptions;
				app.setModel(streamerPageOptions.global);
				app.global = streamerPageOptions.global;
				app.overrides = streamerPageOptions.overrides;
				app.overrideNames = app.getOverrideNames();
			});
		},
		getOverrideNames: function() {
			return Object.keys(this.overrides);
		},
		getSelectedOptions: function() {
			if(this.selected === 'Global') {
				return this.global;
			} else {
				return this.overrides[this.selected];
			}
		},
		setModel: function(options) {
			var app = this;
			var g = app.global;

			//copy over any settings from global that dont exist yet in this override (this happens when new settings are added);
			Object.keys(g).forEach((k) => {
				if(options[k] == null) {
					options[k] = JSON.parse(JSON.stringify(g[k]));
				}
			});

			Object.keys(options).forEach((k) => {
				app[k] = options[k];
			});
		},
		getModel: function() {
			var app = this;
			
			var builtModel = {};
			var options = app.getSelectedOptions();	
			
			Object.keys(options).forEach((k) => {
				builtModel[k] = app[k];
			});

			return builtModel;
		},
		getViewersForCurrentChannel: function() {
			var app = this;
			app.getCurrentStreamerNameInOpenTab().then((name) => {
				if(name == null) return;
				app.$http.get(`https://mixer.com/api/v1/channels/${encodeURIComponent(name)}?fields=id`, {responseType: 'json'})
					.then((response) => {
						if(!response.ok) return;

						var id = response.body.id;
						app.$http.get(`https://mixer.com/api/v1/chats/${id}/users?fields=userName`, {responseType: 'json'})
							.then((response) => {
								if(!response.ok) return;
								app.viewers = response.body.map(v => v.userName);
							});					
					});
			});
		}
	},
	watch: {
		lowestUserRoleLinks: function(newRole) {
			this.saveSettings();
		}
	},
	data: function() {

		var dataObj = {
			selected: 'Global',
			userRoles: [
				{ value: 'owner', text: 'Streamer' },
				{ value: 'mod', text: 'Mods (& above)' },
				{ value: 'subscriber', text: 'Subscribers (& above)' },
				{ value: 'pro', text: 'Pro (& above)' },
				{ value: 'all', text: 'All' }
			],
			overrideNames: [],
			viewers: []
		};

		var defaults = this.getDefaultOptions().streamerPageOptions;

		// fill out our model with the default settings
		var global = defaults.global;		
		Object.keys(global).forEach((k) => {
			dataObj[k] = global[k];
		});

		dataObj.global = global;
		dataObj.overrides = defaults.overrides;

		return dataObj;
	},
	mounted: function() {
		this.loadSettings();
		this.getCurrentStreamerNameInOpenTab().then((name) => {
			if(name != null) {
				this.overrideSelected(name);
			}
		});

		this.getViewersForCurrentChannel();
	}
});