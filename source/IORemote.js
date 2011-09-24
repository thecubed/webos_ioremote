/* Copyright 2011 Tyler Montgomery (TheCubed, IOMonster)
 * For more information, visit http://thecubed.com/?ioremote
 */
enyo.kind({
	name: "IORemote",
	kind: enyo.HFlexBox,
	style: "background: #eee;",
	components: [
		// Database Components
		{kind: "DbService", dbKind: "com.thecubed.ioremote:1", onFailure: "dbFail", components: [
			{name: "dbFind", method: "find", subscribe: true, onSuccess: "queryResponse", onWatch: "queryWatch"},
			{name: "dbDel", method: "del"},
			{name: "dbPut", method: "put"},
			{name: "dbMerge", method: "merge"}
		]},
		{kind: "MockDb", dbKind: "com.thecubed.ioremote:1", onSuccess: "queryResponse", onWatch: "queryWatch"},
		// End Database Components...
		
		{kind:enyo.VFlexBox, width:'320px', style:"border-right: 1px solid;", components: [
			{kind: enyo.Header, pack: "center", components: [
				{content: "Connections"}
			]},
			
			{flex: 1, kind: "Pane", components: [
				/*{flex: 1, kind: "Scroller", components: [
					{kind: enyo.VirtualRepeater, name: "connectionList", onSetupRow: "setupConnectionsList", components: [
						{kind: enyo.SwipeableItem, layoutKind: enyo.HFlexLayout, tapHighlight: true, height: "60px", align: "center", components: [
							{name: "caption", flex: 1},
							{name: "type", className: "enyo-label", content:"RDP"}
						]}
					]}	
				]}*/
				
				{flex: 1, name: "connectionList", kind: "DbList", pageSize: 50, onQuery: "listQuery", onSetupRow: "listSetupRow", components: [
					{name: "item", kind: "SwipeableItem", layoutKind: enyo.HFlexLayout, tapHighlight: true, /*confirmCaption: "Delete",*/ onConfirm: "swipeDelete", onclick: "itemClick", height: "60px", align: "center", components: [
						{name: "caption", flex: 1},
						{name: "type", className: "enyo-label", content:"RDP"}
					]}
				]},
				
			]},
			{kind: "Toolbar", pack: "end", components: [
				{icon: "images/menu-icon-new.png", onclick: "clearValues"}
			]}
		]},
		{kind:enyo.VFlexBox, flex:1, components: [
			{kind: enyo.Header, pack: "center", components: [
				{content: "Details"}
			]},
			{flex: 1, kind: "Pane", components: [
				{flex: 1, kind: "Scroller", components: [
				// right side page components...
					{kind:enyo.VFlexBox, align: "center", components: [
						{kind: enyo.spacer, height: "15px"},
						{kind: enyo.Control, width: "90%", components: [
							// begin controls
							{kind: enyo.Group, caption: "Connection Type", components: [
								{kind: enyo.RadioGroup, name: "connectionType", style: "padding: 5px;", value: "rdp", components: [
									{label: "RDP", value: "rdp"},
									{label: "VNC", value: "vnc", disabled: "true"}
								]}
							]},
							
							{kind: enyo.Group, caption: "Connection Name", components: [
								{kind: enyo.Input, name:"connectionName", hint: "Enter a name...", components: [
									{content: "Connection Name", className: "enyo-label"}
								]}
							]},
							
							{kind: enyo.RowGroup, name:"detailsGroup", caption: "Connection Details", components: [
								{kind: enyo.Input, name: "connectionHost", hint: "Enter a Hostname or IP Address...", components: [
									{content: "Host", className: "enyo-label"}
								]},
								{kind: enyo.Input, name: "connectionPort", hint: "Enter a Port (leave blank for default) ...", components: [
									{content: "Port", className: "enyo-label"}
								]},
								{kind: enyo.Input, name: "connectionUsername", hint: "Enter a Username...", components: [
									{content: "Username", className: "enyo-label"}
								]},
								{kind: enyo.PasswordInput, name: "connectionPassword", hint: "Enter a Password...", components: [
									{content: "Password", className: "enyo-label"}
								]},
								{kind: enyo.Input, name: "connectionDomain", hint: "Enter a Domain Name...", components: [
									{content: "Domain", className: "enyo-label"}
								]}
							]},
							
							{kind: enyo.RowGroup, caption: "RDP Connection Options", components: [
								{kind: enyo.ListSelector, name: "connectionSpeed", label: "Speed", style: "padding: 5px;", items: [
									{caption: "LAN", value: "1"},
									{caption: "Cable/ADSL", value: "2"},
									{caption: "DialUp", value: "3"},
									{caption: "Earth-Mars", value: "4"}
									]
								}
							]}
							// end controls
						]}
					]}
				// end right side page components...	
				]}
			]},
			{kind: "Toolbar", pack: "end", components: [
				{kind: enyo.Button, className: "enyo-button-blue", width: "80px", caption: "Connect", onclick: "startRDP"},
				{kind: enyo.spacer, width: "1%"},
				{icon: "images/menu-icon-save.png", onclick: "saveValues"}
			]}
		]},
		{kind: "ModalDialog", name: "errorPopup", scrim: true, caption: "Uh Oh!", components: [
			{content: "Some required information is missing or incorrect.<br />Please double check your entries...", style: "padding: 15px;"},
			{kind: "Button", caption: "Close", popupHandler: true}
		]}
	],
	
	/*
	 * BEGIN WORKER CODE
	 * Here be dragons! Also, here be the code that I'm possibly ashamed to say is mine.
	 * Please keep in mind, I've never used Enyo before-- so when criticizing me, please be sure to provide the correct implementation for me :)
	 */
	
	// DATABASE WORKER FUNCTIONS
	dbFail: function(inSender, inResponse) {
		this.log("dbService failure: " + enyo.json.stringify(inResponse));
	},
	listQuery: function(inSender, inQuery) {
		if (window.PalmSystem) {
			//inQuery.orderBy = "host";
			return this.$.dbFind.call({query: inQuery});
		} else {
			return this.$.mockDb.call({query: inQuery}, {method: "find"});
		}
	},
	queryResponse: function(inSender, inResponse, inRequest) {
		this.$.connectionList.queryResponse(inResponse, inRequest);
	},
	listSetupRow: function(inSender, inRecord, inIndex) {
		this.$.item.canGenerate = !inRecord.deleted;
		this.$.caption.setContent(inRecord.name);
		this.$.type.setContent(inRecord.type);
	},
	itemClick: function(inSender, inEvent) {
		//this.setSelectedRecord(this.$.connectionList.fetch(inEvent.rowIndex));
		selectedItem = inEvent.rowIndex;
		controlList = Array("connectionName", "connectionHost", "connectionPort", "connectionUsername", "connectionPassword", "connectionDomain");
		dbList = Array("name", "host", "port", "username", "password", "domain");
		for (item in controlList) {
			eval("this.$."+controlList[item]+".setValue(this.$.connectionList.fetch(selectedItem)."+dbList[item]+")");
		}
	},
	deleteRecord: function(inRecord) {
		if (inRecord) {
			inRecord.deleted = true;
			if (window.PalmSystem) {
				this.$.dbDel.call({ids: [inRecord._id]});
			} else {
				this.$.mockDb.call({ids: [inRecord._id]}, {method: "del"});
			}
		}
	},
	swipeDelete: function(inSender, inIndex) {
		this.deleteRecord(this.$.connectionList.fetch(inIndex));
	},
	queryWatch: function() {
		this.log("dbService watch fired at " + new Date().toLocaleTimeString());
		this.$.connectionList.reset();
	},
	saveValues: function(inSender) {
		if (this.checkValues()) {
			this.log("Saving Values...");
			record = {"name": this.$.connectionName.value, "type": this.$.connectionType.value, "host": this.$.connectionHost.value, "port": this.$.connectionPort.value, "username": this.$.connectionUsername.value, "password": this.$.connectionPassword.value, "domain": this.$.connectionDomain.value};
			if (window.PalmSystem) {
				this.$.dbPut.call({objects: [record]});
			} else {
				this.$.mockDb.call({objects: [record]}, {method: "put"});
			}
		} else {
			this.$.errorPopup.openAtCenter();
		}
	},
	// END DATABASE WORKER FUNCTIONS
	
	
	checkValues: function() {
		if (this.$.connectionName.value != "" && this.$.connectionHost.value != "") {
			return true;
		} else {
			return false;
		}
	},
	
	clearValues: function(inSender) {
		this.log("Clearing Values...");
		toClear = Array("connectionName", "connectionHost", "connectionPort", "connectionUsername", "connectionPassword", "connectionDomain");
		for (item in toClear) {
			eval("this.$."+toClear[item]+".setValue('')");
		}	
	},
	
	startRDP: function(inSender) {
		this.log("Starting Connection...");
		this.$.errorPopup.openAtCenter();
	}
	
	
});

