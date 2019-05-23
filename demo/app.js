
var root = document.body

m.render(root, m("h1", "Application Demo"))

var Hello = {
    view: function() {
        return m("button", {onclick: function() {window.alert("hello, world.");}}, "hello...")
    }
}
m.mount(root, Hello)
