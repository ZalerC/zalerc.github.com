// tm.utils.extend.js

/* tm.utils */
if (typeof(Utils) == "undefined" || Utils.__code__ != "TM.Utils") {
    var Utils = (name) => Utils[name];
    Utils.__code__ = "TM.Utils";
}

// Utils.extend
(function(utils) {
    utils.extend = "extend";
    console.log("utils.extend>");
    console.log(utils.plugin);
    console.log(utils.extend);
})(Utils);
