// tm.utils.plugin.js

/* tm.utils */
if (typeof(Utils) == "undefined" || Utils.__code__ != "TM.Utils") {
    var Utils = (name) => Utils[name];
    Utils.__code__ = "TM.Utils";
}

// Utils.plugin
(function(utils) {
    utils.plugin = "plugin";
    console.log("utils.plugin>");
    console.log(utils.extend);
    console.log(utils.plugin);
})(Utils);
