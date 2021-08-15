function anonymous() {
    with(this) {
        return _c('div', { attrs: { "id": "app" }}, 
            [_c('ul', _l((list), function (item, index) { return _c('li', { on: {
                    "click": function ($event) { return del(index) }
                }
            }, [_v(_s(item))])
        }), 0)])
    }
}
