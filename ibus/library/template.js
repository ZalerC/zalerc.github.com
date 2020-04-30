// template.js
// 如果存在jQuery则使用jQuery模式

/*
渲染 分为 预渲染(pre-render) 和 渲染(render)
预渲染用于模板装载后的第一次渲染
    依赖属性: pre-render='text,val,html,<attr>,...'
    格式化简易模式依赖 attr:name 用于搜索给定键值对
    高级格式化依赖 attr:pre-render-*, * 为 pre-render 指定值
    如果 attr:pre-render-* 未设定，降级使用 attr:render-*
渲染用于数据或信息更新
    依赖属性: render='text,val,html,<attr>,...'
    格式化简易模式依赖 attr:name 用于搜索给定键值对
    高级格式化依赖 attr:render-*, * 为 render 指定值
挂载 用于源元素复制后插入到目标位置
    1.自身复制, false
    2.子元素全复制, true
    3.列表内指定name的子元素复制, ['<name>',...]
    4.字典内指定target.name:source.name的子元素复制, {'<target.name>':'<source.name>'}
*/

(function(configure) {
    /* load configure */
    let self;
    let [_globals, _namespace ] = [configure.globals, configure.namespace];
    if (_globals === 'always' || (_globals === 'alternate' && (typeof module === 'undefined' || typeof module.exports === 'undefined'))) {
        self = window[_namespace] = window[_namespace] || {};
    } else if (_globals === 'none') {
        self = {};
    }
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = self;
    }
    /* jQuery support */
    let jQuerySupported = false;
    if (typeof window.jQuery !== 'undefined') {
        jQuerySupported = true;
    }
    /* code content */
    // format
    let format = function(fmt, parameters, default_value) {
        parameters = parameters || {};
        return fmt.replace(/\${(.*?)}/g, function(match, key) {
            return (key in parameters) ? parameters[key] : default_value;
        });
    };
    /* render */
    let render = function(selector, parameters, settings) {
        /* settings:
            attrs: 带渲染属性位组标识属性
            name: 快速模式格式标识属性
            format: 高级模式格式化标识属性列表
            default: 未找到数据定义
        */
        let elements;
        if (jQuerySupported) {
            elements = $(selector).find(`[${settings.attrs}]`);
            if ($(selector).attr(settings.attrs)) {
                elements.push($(selector));
            }
        } else {
            if (typeof selector === 'string') {
                selector = document.querySelector(selector);
            }
            elements = Array.from(selector.querySelectorAll(`[${settings.attrs}]`));
            if (settings.attrs in selector.attributes) {
                elements.push(selector);
            }
        }
        let default_value = settings.default || '<undefined>';
        // loop elements
        for (let i = 0; i < elements.length; i++) {
            // [${settings.name}]
            // [${settings.attrs}]
            let element, name, attrs;
            if (jQuerySupported) {
                element = $(elements[i]);
                name = element.attr(settings.name) || '';
                attrs =  element.attr(settings.attrs).split(/(?:,\s*|\s+)/);
            } else {
                element = elements[i];
                name = element.getAttribute(settings.name) || '';
                attrs =  element.getAttribute(settings.attrs).split(/(?:,\s*|\s+)/);
            }
            for (let i = 0; i < attrs.length; i++) {
                let attr = attrs[i].trim();
                // checkout or format
                let fmt;
                for (let j = 0; j < settings.format.length; j++) {
                    let fmt_attr = format(settings.format[j], { attr:attr }, '');
                    if (jQuerySupported) {
                        if (element.attr(fmt_attr)) {
                            fmt = element.attr(fmt_attr);
                            break;
                        }
                    } else {
                        if (element.getAttribute(fmt_attr)) {
                            fmt = element.getAttribute(fmt_attr);
                            break;
                        }
                    }
                }
                let value = default_value;
                // parameters = function
                if (typeof parameters === 'function') {
                    value = parameters(name, attr, fmt);
                } else if (fmt) {
                    value = format(fmt, parameters, default_value);
                } else {
                    value = (name in parameters) ? parameters[name] : default_value;
                }
                // render
                if (jQuerySupported) {
                    if (attr === 'text') {
                        element.text(value);
                    } else if (attr === 'value' || attr === 'val') {
                        element.val(value);
                    } else if (attr === 'html') {
                        element.html(value);
                    } else {
                        element.attr(attr, value);
                    }
                } else {
                    if (attr === 'text') {
                        element.innerText = value;
                    } else if (attr === 'value' || attr === 'val') {
                        element.value = value;
                    } else if (attr === 'html') {
                        element.innerHTML = value;
                    } else {
                        element.setAttribute(attr, value);
                    }
                }
            }
        }
    };
    // pre-render
    self.prerender = function(selector, parameters) {
        render(selector, parameters, {
            attrs: 'pre-render',
            name: 'name',
            format: ['pre-render-${attr}', 'render-${attr}']
        });
    }
    // render
    self.render = function(selector, parameters) {
        // parameters is an object or callback(name, attr, fmt)
        render(selector, parameters, {
            attrs: 'render',
            name: 'name',
            format: ['render-${attr}']
        });
    };
    /* mount */
    // target.children <- source.children
    // target.children <- source
    let mount = function(target, source, child = false) {
        if (jQuerySupported) {
            if (child) {
                if ($(source).html() === $(source).text()) {
                    $(target).html($(source).text());
                } else {
                    let html = $(source).html();
                    $(target).html($(html));
                }
            } else {
                let HTML = $(source).clone();
                $(target).html(HTML);
            }
        } else {
            if (typeof target === 'string') {
                target = document.querySelector(target);
            }
            if (typeof source === 'string') {
                source = document.querySelector(source);
            }
            let html;
            if (child) {
                html = source.innerHTML;
            } else {
                html = source.outerHTML;
            }
            target.innerHTML = html;
        }
    };
    // mount
    /* names: 1.['<name>', ...], 3.{'<target.name>': '<source.name>', ...}
       child: 1.true:as child; 2.false:not as child
    */
    self.mount = function(target, source, names, parameters) {
        if (typeof names === 'boolean') {
            mount(target, source, names);
        } else if (typeof names === 'object' || names !== null) {
            if (jQuerySupported === false) {
                if (typeof source === 'string') {
                    source = document.querySelector(source);
                }
                if (typeof target === 'string') {
                    target = document.querySelector(target);
                }
            }
            if (names instanceof Array) {
                for (let i = 0; i < names.length; i++) {
                    let name = names[i];
                    let elements;
                    if (jQuerySupported) {
                        elements = $(target).find(`[name=${name}]`);
                    } else {
                        elements = target.querySelectorAll(`[name=${name}]`);
                    }
                    if (elements.length === 0) { continue; }
                    for (let j = 0; j < elements.length; j++) {
                        let element = elements[j];
                        let src;
                        if (jQuerySupported) {
                            src = $(source).find(`[name=${name}]`);
                            if (src.length === 0) { continue; }
                        } else {
                            src = source.querySelector(`[name=${name}]`);
                            if (src === null) { continue; }
                        }
                        mount(element, src, true);
                    }
                }
            } else {
                for (let key in names) {
                    let value = names[key];
                    let elements;
                    if (jQuerySupported) {
                        elements = $(target).find(`[name=${key}]`);
                    } else {
                        elements = target.querySelectorAll(`[name=${key}]`);
                    }
                    if (elements.length === 0) { continue; }
                    for (let j = 0; j < elements.length; j++) {
                        let element = elements[j];
                        let src;
                        if (jQuerySupported) {
                            src = $(source).find(`[name=${value}]`);
                            if (src.length === 0) { continue; }
                        } else {
                            src = source.querySelector(`[name=${value}]`);
                            if (src === null) { continue; }
                        }
                        mount(element, src, true);
                    }
                }
            }
        }
        // 目标点 预渲染
        if (parameters) {
            self.prerender(target, parameters);
        }
    };
    // append
    self.append = function(target, source, child = false, parameters) {
        if (jQuerySupported) {
            if (child) {
                if ($(source).html() === $(source).text()) {
                    $(target).html($(target).text() + $(source).text());
                } else {
                    let html = $(source).html();
                    let element = $(html);
                    if (parameters) {
                        self.prerender(element, parameters);
                    }
                    $(target).append(element);
                }
            } else {
                let element = $(source).clone();
                if (parameters) {
                    self.prerender(element, parameters);
                }
                $(target).append(element);
            }
        } else {
            if (typeof target === 'string') {
                target = document.querySelector(target);
            }
            if (typeof source === 'string') {
                source = document.querySelector(source);
            }
            let element;
            if (child) {
                // 未验证有效性，可能无法使用
                element = document.createRange().createContextualFragment(source.innerHTML);
            } else {
                element = source.cloneNode(true);
            }
            if (parameters) {
                self.prerender(element, parameters);
            }
            target.appendChild(element);
        }
    };
})({
    namespace: 'Template',
    globals: 'always',  // 'always':<always load namespace>, 'none':<not load namespace>, 'alternate':<if no module, load namespace>
});
