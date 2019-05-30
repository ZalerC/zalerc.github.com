// ==UserScript==
// @name         XixiTalkTwitterFilter
// @namespace    zldream1011@gmail.com
// @version      0.2.0 - 20190529
// @description  中文推特热榜过滤(XixiTalk)
// @author       Zaler
// @match        https://xixitalk.github.io/twitter/*.html
// @grant        none
// ==/UserScript==

(function() {
    'use strict'

    /* 规则编辑界面 */
    let createEditor = function(storage, template=null, dialog=null, json=true) {
        // template
        if (template == null) {
            if (json == true) {
                template = '{\n"__COMMENT__": "Write key:value here"\n}'
            } else {
                template = 'Something you want write...'
            }
        } else {
            if (json == true) {
                try {
                    JSON.parse(template)
                } catch (e) {
                    window.alert("Template(JSON) is invalid.")
                    throw(e)
                }
            }
        }
        // layout
        let layout = {
            menu: "Menu",
            title: "Editor",
            close: "Close",
            save: "Save",
            saved: "Saved."
        }
        if (dialog != null && typeof(dialog) == "object") {
            layout = Object.assign(layout, dialog)
        }
        // html
        let html = `
        <style>
        a.menu {
            display: block;
            position: fixed;
            top: 5px;
            right: 5px;
            border-style: solid;
            border-width: 1px;
            padding: 3px;
        }
        div.editor {
            display: none;
            position: fixed;
            top: 10%;
            left: 10%;
            border-style: solid;
            border-width: 1px;
        }
        div.editor div {
            background-color: rgb(238, 238, 238);
        }
        div.editor button {
            float: right;
        }
        div.editor span {
            float: right;
        }
        div.editor textarea {
            width: 600px;
            height: 400px;
        }
        </style>
        <a class="menu" href="javascript:void(0);">${layout.menu}</a>
        <div class="editor">
            <div>&nbsp;&nbsp;${layout.title}&nbsp;
                <button id="editor-close">${layout.close}</button>
                <span>&nbsp;</span>
                <button id="editor-save">${layout.save}</button>
            </div>
            <textarea></textarea>
        </div>`
        // make
        let container = document.createElement("div")
        container.innerHTML = html
        document.body.appendChild(container)
        // event
        container.querySelector("a.menu").addEventListener("click", function() {
            let editor = container.querySelector("div.editor")
            editor.style.display = "block"
            let content = window.localStorage.getItem(storage)
            if (content == null) {
                content = template
            }
            editor.querySelector("textarea").value = content
        }, false)
        document.querySelector("#editor-close").addEventListener("click", function() {
            let editor = container.querySelector("div.editor")
            editor.style.display = "none"
        }, false)
        document.querySelector("#editor-save").addEventListener("click", function() {
            let content = container.querySelector("div.editor > textarea").value
            if (json == true) {
                try {
                    JSON.parse(content)
                    window.localStorage.setItem(storage, content)
                    window.alert(layout.saved)
                } catch (e) {
                    window.alert(e)
                }
            } else {
                window.localStorage.setItem(storage, content)
                window.alert(layout.saved)
            }
        }, false)
    }

    /* 获取Twitter所有条目 */
    let getAllTwitterEntries = function() {
        return document.querySelectorAll("body > table > tbody > tr")
    }
    /* 解析Twitter条目 */
    let parseTwitterEntry = function(entry) {
        let message = {}
        // avatar(用户头像)
        message.avatar = entry.querySelector("td:nth-child(1) > img").src
        // name(用户名称)
        message.name = entry.querySelector("td:nth-child(2) > b").innerText
        // url(twiiter链接)
        message.url = entry.querySelector("td:nth-child(2) > a").href
        // time(时间)
        let time = entry.querySelector("td:nth-child(2) > a > span").innerText
        message.time = time.slice(0, time.length - 2)
        // content(全部文本内容)
        message.content = entry.querySelector("td:nth-child(2)").innerText
        // id
        message.id = message.content.match(/@.+\b/)[0]
        // text(文本内容)
        let lines = message.content.split("\n")
        message.text = lines.slice(1, lines.length - 3).join("\n")
        // retweets & likes
        //let like = entry.querySelector("td:nth-child(2) > span").innerText
        //[message.retweets, message.likes] = like.match(/\d+/g).map(x => parseInt(x))

        return message
    }
    /* filter.blacklist */
    let filterBlacklist = function (message, blacklist) {
        return blacklist.indexOf(message.id) > -1
    }
    /* 追加条目到文档 */
    let pushTwitterEntries = function(messages) {
        let tbody = document.querySelector("body > table > tbody")
        for (let [id, list] of messages) {
            list.forEach(function(message){
                if (message.disabled == false) {
                    tbody.appendChild(message.entry)
                } else {
                    tbody.removeChild(message.entry)
                }
            })
        } 
    }
    /* main */
    let main = function() {
        // create editor
        let $template = '{\n"blacklist":[],\n"ignorewords":[]}'
        createEditor("filters", $template, {
            title: "规则编辑器",
            menu: "规则",
            close: "关闭",
            save: "保存",
            saved: "保存完成."
        })
        // filters
        let $filters = window.localStorage.getItem("filters")
        let filters
        if ($filters == null){
            filters = JSON.parse($template)
        } else {
            filters = JSON.parse($filters)
        }
        let blacklist = []
        for (let i = 0; i < filters.blacklist.length; i++) {
            let v = filters.blacklist[i]
            if (v.startsWith("@") == true) {
                blacklist.push(v)
            }
        }
        // parse
        let entries = getAllTwitterEntries();
        let messages = new Map();
        entries.forEach(function(entry){
            let message = parseTwitterEntry(entry);
            message.entry = entry;
            message.disabled = false;
            if (messages.has(message.id) != true) {
                messages.set(message.id, []);
            }
            messages.get(message.id).push(message)
            // filter blacklist
            if (filterBlacklist(message, blacklist) == true) {
                message.disabled = true
                return
            }
        })
        // push
        pushTwitterEntries(messages)
    }
    main()
})()
