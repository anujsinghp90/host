/*
AS Attributes Export
Created by Jason Paddock
Date: 2/23/18
Version: 1.2
Change Log: 
    1.0: Initial Release
    1.1: Update to support sso and private cloud
    1.2: Include Description in Export
*/
window.as_attributes_export = window.as_attributes_export || {

    initialized: false,

    // Initialize message object with data object for passing information
    message: {
        header: '',
        footer: '<br><p style="">Comments / bugs / feature requests? Send them to <a href="mailto:jason.paddock@tealium.com">jason.paddock@tealium.com</a></p>',
        namespace: "as_attributes_export_main",
        data: {
            msg_queue: []
        },
        version: 1.1
    },

    // Incoming tool object from Tealium tools .html (Handlebars) UI
    main: function(tool) {
        if (document.URL.indexOf('.tealiumiq.com/datacloud') === -1) {
            this.error('This tool only works when you are running it within the UDH application.');
            return false
        }
        switch (tool.command) {
            case "start":
                this.start();
                break;
            case "download":                
                this.download();
                break;
            case "exit":
                this.exit();
                break;
            default:
                this.error("Unknown command received from Tealium Tool: '"+tool.command+"'");
                break;
        }
        tealiumTools.send(this.message);

    },
    download: function() {
        var that = this;
        var csv = "Scope,Name,ID,Type\n";
        Object.keys(that.message.data.attributes.visitor).sort().forEach(function(key){
            csv += "Visitor,"+key+","+that.message.data.attributes.visitor[key].id+","+that.message.data.attributes.visitor[key].fullyQualifiedId+"\n";
        });
        Object.keys(that.message.data.attributes.visit).sort().forEach(function(key){
            csv += "Visit,"+key+","+that.message.data.attributes.visit[key].id+","+that.message.data.attributes.visit[key].fullyQualifiedId+"\n";
        });
        var b = document.createElement('a'),
            $s,
            csvData = new Blob([csv], {
                type: 'text/csv'
            });
        b.setAttribute("id", "as-attributes-csv-export");
        b.setAttribute("href", URL.createObjectURL(csvData));
        b.setAttribute("download", that.message.data.account_name + " audience stream attributes export.csv");
        document.body.appendChild(b);
        $s = $.find('#as-attributes-csv-export')[0];
        $s.click();
        $s.remove();
    },
    getAllASAttributes: function(){
        var that = this;
        gApp.inMemoryModels.quantifierCollection.models.forEach(function(key){
            if(key.attributes.context.displayName.match(/visit/i) && !key.attributes.hidden){
                that.message.data.attributes[key.attributes.context.displayName][key.attributes.name] = {
                    id : key.attributes.id,
                    name : key.attributes.name,
                    fullyQualifiedId : key.attributes.fullyQualifiedId.split('.').length === 3 ? key.attributes.fullyQualifiedId.split('.')[1] : key.attributes.fullyQualifiedId.split('.')[0],
                    description : key.attributes.description,
                    type : key.attributes.type.displayName,
                    scope : key.attributes.context.displayName
                };
            }
        });

    },
    log: function(str) {
        console.log(str);
        this.message.data.msg_queue.push(str);
        tealiumTools.send(this.message);
    },
    exit: function() {
        this.message.exit = true;
    },
    start: function() {
        this.message.exit = false;
        this.ui_state('ui_start');
        this.message.data.account_name = gApp.inMemoryModels.account;
        this.message.data.attributes = {
            visit: {},
            visitor: {}
        };
        this.getAllASAttributes();        
    },

    makeProgressCircle: function(msg) {
        // console.log("makeProgressCircle");
        this.ui_state('ui_wait');
        if (typeof msg !== 'undefined') {
            this.message.data.wait_message = msg;
        }
        tealiumTools.send(this.message);
    },

    ui_state: function(cmd) {
        var that = this;
        Object.keys(this.message).forEach(function(key, index) {
            if (key.indexOf('ui_') === 0) {
                that.message[key] = false;
            }
        });
        this.message[cmd] = true;
    },

    error: function(msg) {
        this.ui_state('ui_error');
        this.message.data.error_message = msg;
        console.log('Error: '+msg);
        tealiumTools.send(this.message);
    }
}

window.as_attributes_export_main = function(arg) {
    return as_attributes_export.main(arg);
}

if (!as_attributes_export.initialized) {
    as_attributes_export.initialized = true;
    as_attributes_export_main({
        command: "start"
    });
} else {
    if (typeof as_attributes_export.message.ui_finish === 'undefined' || as_attributes_export.message.exit === true) {
        as_attributes_export_main({
            command: "start"
        });
    }
} 