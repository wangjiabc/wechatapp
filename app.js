//app.js
var util = require('./utils/utils.js');
var api = require('./api.js');
App({
    is_on_launch: true,
    onLaunch: function () {
        console.log(wx.getSystemInfoSync());
        this.getStoreData();
        this.getCatList();
    },

    getStoreData: function () {
        var page = this;
        this.request({
            url: api.default.store,
            success: function (res) {
                if (res.code == 0) {
                    wx.setStorageSync("store", res.data.store);
                    wx.setStorageSync("store_name", res.data.store_name);
                    wx.setStorageSync("show_customer_service", res.data.show_customer_service);
                    wx.setStorageSync("contact_tel", res.data.contact_tel);
                    wx.setStorageSync("share_setting", res.data.share_setting);
                }
            },
            complete: function () {
                page.login();
            }
        });
    },

    getCatList: function () {
        this.request({
            url: api.default.cat_list,
            success: function (res) {
                if (res.code == 0) {
                    var cat_list = res.data.list || [];
                    wx.setStorageSync("cat_list", cat_list);
                }
            }
        });
    },

    login: function () {
        var pages = getCurrentPages();
        var page = pages[(pages.length - 1)];
        wx.showLoading({
            title: "正在登录",
            mask: true,
        });
        wx.login({
            success: function (res) {
                if (res.code) {
                    var code = res.code;
                    wx.getUserInfo({
                        success: function (res) {
                            //console.log(res);
                            getApp().request({
                                url: api.passport.login,
                                method: "post",
                                data: {
                                    code: code,
                                    user_info: res.rawData,
                                    encrypted_data: res.encryptedData,
                                    iv: res.iv,
                                    signature: res.signature
                                },
                                success: function (res) {
                                    wx.hideLoading();
                                    console.log(code)
                                    if (res.code == 0) {
                                        wx.setStorageSync("access_token", res.data.access_token);
                                        wx.setStorageSync("user_info", {
                                            nickname: res.data.nickname,
                                            avatar_url: res.data.avatar_url,
                                            is_distributor: res.data.is_distributor,
                                            parent: res.data.parent,
                                            id: res.data.id,
                                            is_clerk: res.data.is_clerk
                                        });
                                        console.log(res);
                                        // var parent_id = wx.getStorageSync("parent_id");
                                        var p = getCurrentPages();
                                        var parent_id = 0;
                                        if (p[0].options.user_id != undefined) {
                                            var parent_id = p[0].options.user_id;
                                        }
                                        else if (p[0].options.scene != undefined) {
                                            var parent_id = p[0].options.scene;
                                        }
                                        // console.log(parent_id, p[0].options.scene, p[0].options.user_id);
                                        getApp().bindParent({
                                            parent_id: parent_id || 0
                                        });

                                        if (page == undefined) {
                                            return;

                                        }
                                        wx.redirectTo({
                                            url: "/" + page.route + "?" + util.objectToUrlParams(page.options),
                                            fail: function () {
                                                wx.switchTab({
                                                    url: "/" + page.route,
                                                });
                                            },
                                        });
                                    } else {
                                        wx.showToast({
                                            title: res.msg
                                        });
                                    }
                                }
                            });
                        }
                    });
                } else {
                    //console.log(res);
                }

            }
        });
    },
    request: function (object) {
        var access_token = wx.getStorageSync("access_token");
        //console.log(object);
        //console.log(access_token);
        if (access_token) {
            if (!object.data)
                object.data = {};
            object.data.access_token = access_token;
        }
        wx.request({
            url: object.url,
            header: object.header || {
                'content-type': 'application/x-www-form-urlencoded'
            },
            data: object.data || {},
            method: object.method || "GET",
            dataType: object.dataType || "json",
            success: function (res) {
                if (res.data.code == -1) {
                    getApp().login();
                } else {
                    if (object.success)
                        object.success(res.data);
                }
            },
            fail: function (res) {
                var app = getApp();
                if (app.is_on_launch) {
                    app.is_on_launch = false;
                    wx.showModal({
                        title: "网络请求出错",
                        content: res.errMsg,
                        showCancel: false,
                        success: function (res) {
                            if (res.confirm) {
                                if (object.fail)
                                    object.fail(res);
                            }
                        }
                    });
                } else {
                    wx.showToast({
                        title: res.errMsg,
                        image: "/images/icon-warning.png",
                    });
                    if (object.fail)
                        object.fail(res);
                }
            },
            complete: function (res) {
                if (object.complete)
                    object.complete(res);
            }
        });
    },
    saveFormId: function (form_id) {
        this.request({
            url: api.user.save_form_id,
            data: {
                form_id: form_id,
            }
        });
    },

    loginBindParent: function (object) {
        var access_token = wx.getStorageSync("access_token");
        if (access_token == '') {
            return true;
        }
        getApp().bindParent(object);
    },
    bindParent: function (object) {
        if (object.parent_id == "undefined" || object.parent_id == 0)
            return;
        console.log("Try To Bind Parent With User Id:" + object.parent_id);
        var user_info = wx.getStorageSync("user_info");
        var share_setting = wx.getStorageSync("share_setting");
        if (share_setting.level > 0) {
            var parent_id = object.parent_id;
            if (parent_id != 0) {
                getApp().request({
                    url: api.share.bind_parent,
                    data: {parent_id: object.parent_id},
                    success: function (res) {
                        if (res.code == 0) {
                            user_info.parent = res.data
                            wx.setStorageSync('user_info', user_info);
                        }
                    }
                });
            }
        }
    },

    /**
     * 分享送优惠券
     * */
    shareSendCoupon: function (page) {
        wx.showLoading({
            mask: true,
        });
        if (!page.hideGetCoupon) {
            page.hideGetCoupon = function (e) {
                var url = e.currentTarget.dataset.url || false;
                page.setData({
                    get_coupon_list: null,
                });
                if (url) {
                    wx.navigateTo({
                        url: url,
                    });
                }
            };
        }
        this.request({
            url: api.coupon.share_send,
            success: function (res) {
                if (res.code == 0) {
                    page.setData({
                        get_coupon_list: res.data.list
                    });
                }
            },
            complete: function () {
                wx.hideLoading();
            }
        });
    },
});