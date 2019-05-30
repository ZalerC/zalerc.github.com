// tm.utils.js

/* tm.utils */
if (typeof(Utils) == "undefined" || Utils.__code__ != "TM.Utils") {
    var Utils = (name) => Utils[name];
    Utils.__code__ = "TM.Utils";
}
