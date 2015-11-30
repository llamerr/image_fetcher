"use strict";

require('colors');

var wd = require('wd');
var browser = wd.promiseChainRemote();
// optional extra logging
browser.on('status', function(info) {
    console.log(info.cyan);
});
browser.on('command', function(eventType, command, response) {
    console.log(' > ' + eventType.cyan, command, (response || '').grey);
});
browser.on('http', function(meth, path, data) {
    console.log(' > ' + meth.magenta, path, (data || '').grey);
});

var options = {
    //browserName: 'phantomjs',
    browserName: 'chrome'
};

var longTimeout = 2000;

var asserters = wd.asserters; // commonly used asserters

wd.webdriver.prototype.vk_login = function (username, password) {
    return this
        .get('https://vk.com')
        .elementById('quick_email')
        .type(username)
        .elementById('quick_pass')
        .type(password)
        .elementById('quick_login_button')
        .click()
        .waitFor(asserters.jsCondition('document.location.href == "https://vk.com/feed"'), longTimeout)
}
wd.webdriver.prototype.vk_my_page = function () {
    return this
        .elementById('myprofile')
        .click()
        .waitForElementByCss('#header', asserters.isVisible, longTimeout)
}
wd.webdriver.prototype.vk_open_page = function(page_id) {
    return this
        .get('https://vk.com/'+page_id)
        .waitForElementByCss('#header', asserters.isVisible, longTimeout)
        .waitFor(asserters.jsCondition('document.location.href == "https://vk.com/' + page_id + '"'), longTimeout)
}
wd.webdriver.prototype.vk_post_start = function () {
    return this
        .elementById('post_field')
        .click()
        .waitForElementByCss('#page_add_media', asserters.isVisible, longTimeout)
}
wd.webdriver.prototype.vk_post_get_media_type_id = function() {
    return this
        .execute('return document.querySelector(".add_media_menu").id.split("_")[3]')
        .then(function(type_id){
            wd.webdriver.prototype.vk_post_type_id = type_id;
            return type_id;
        })
}
wd.webdriver.prototype.vk_post_add_postpone = function (unixtime) {
    return this
        .execute("document.querySelector('.add_media_type_" + wd.webdriver.prototype.vk_post_type_id + "_postpone').click();")
        .waitForElementByCss('#page_ppdocs_preview15', asserters.isVisible, longTimeout)
        .execute("$('#postpone_date15').value = " + unixtime)
}
wd.webdriver.prototype.vk_post_add_text = function (text) {
    return this
        .elementById('post_field')
        .type(text)
}
wd.webdriver.prototype.vk_post_publish = function () {
    return this
        .elementById('send_post')
        .click()
        .waitFor(asserters.jsCondition('document.getElementById("send_post").classList.contains("flat_btn_lock") == false'), longTimeout)
}

var img1 = 'https://pp.vk.me/c7008/v7008291/2ef81/3TVL55hg9BU.jpg',
    img2 = 'http://i.imgur.com/0jWQ4LQ.jpg';

var config = require('./config');
browser
    .init(options)
    .then( () => console.log('init: done') )
    .vk_login(config.vk_user.login, config.vk_user.pass)
    .vk_open_page(config.group)
    .vk_post_start()
    .vk_post_add_text('test')
    //.vk_post_add_postpone()
    .vk_post_publish()
    .then( () => console.log('done: taking screen') )
    .saveScreenshot('./snapshot.png')
    .then( () => console.log('done: exit') )
    .fin(function() { return browser.quit(); })
    .done();