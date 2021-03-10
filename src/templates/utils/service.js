/**
 * @description 1897后台公共接口请求方法封装
 */
import { validatenull } from "./validate";
import { winkeyBaseUrl } from "../api/config";
import Fly from "./wx.umd.min";
var qs = require("qs");

// 封装fly
var request = new Fly();

// export const winkeyBaseUrl = 'http://192.168.1.133:80';

// 请求拦截器
request.interceptors.request.use(function (request) {
  // if(request.showLoading) {
    wx.showLoading({
      title: "正在加载...",
      mask: true,
    });
  // }
  // 添加登录判断拦截,根据当前是否有用户信息手机号，没有的话跳转首页,首页的请求不拦截
  // if(!wx.getStorageSync("isIndex") && validatenull(wx.getStorageSync("userInfo").member_no)) {
  //   // 去首页注册登录
  //   wx.showToast({
  //     title: '请先授权登录',
  //     icon: 'none'
  //   })
  //   setTimeout(() =>{
  //     wx.switchTab({
  //       url: `/pages/index/index`
  //     })
  //   }, 2000);
  //   return Promise.reject();
  // }

  request.baseURL = winkeyBaseUrl;
  request.timeout = 10000;
  request.headers["Authorization"] =
    "Basic dGVuY2VudF9taW5pcHJvZ3JhbTp0ZW5jZW50X21pbmlwcm9ncmFtX3NlY3JldA==";
  request.headers["Tenant-Id"] = "100000";

  const token = wx.getStorageSync("token");
  
  if (token) {
    request.headers["Blade-Auth"] = "Bearer " + token;
    // request.headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
 
  // 保证每一次请求的headers传递都能传入都是有效的
  const headers = request.headers || {}
  request.headers = headers;

  return request;
});

// 响应拦截器   //请勿使用箭头函数，会导致this的指向异常！！！
request.interceptors.response.use(
  function (response) {
    wx.hideLoading()
    const res = response.data;
    if (!res || typeof res !== "object") {
      wx.showToast({
        title: "服务器响应格式错误",
        icon: "none",
        duration: 2000,
      });
    } else {
      const { code, msg, message } = res;
      // token接口无状态码 TODO: 提取公共参数
      if (code !== 200 && response.url === "/blade-auth/oauth/token") {
        wx.showToast({
          title: msg || message || "",
          icon: "none",
          duration: 2000,
        });

        return Promise.reject(new Error(res.msg || "Error"));
      }
    }

    return response.data; //只返回业务数据部分
  },
  function (err) {
    console.log(err);
    wx.hideLoading();
    
    if (err.status === 401) {
      console.error("用户身份过期，将自动刷新Token！");
      const memberNumber = wx.getStorageSync("userInfo").memberNumber;
      if (memberNumber) {
        this.lock();
        const that = this;

        // TODO：待优化
        // 优化点：1. 公共参数提取 2. 直接使用getToken()请求无法进入then，暂时找不到原因，先使用以下这种方式
        const newFly = new Fly();
        return newFly
        .post(winkeyBaseUrl + 
          `/blade-auth/oauth/token?grant_type=member_number&scope=all&memberNumber=${memberNumber}`,
          {},
          {
            headers: {
                'Authorization': 'Basic dGVuY2VudF9taW5pcHJvZ3JhbTp0ZW5jZW50X21pbmlwcm9ncmFtX3NlY3JldA==',
                'Tenant-Id': '100000',
            }
        })
        .then(res => {
          console.log(res)
          if (res.status === 200) {
            wx.setStorageSync("token", res.data.access_token);
          }
        })
        .then(() => {
          that.unlock()
          return request.request(err.request)
        })
        .catch(err => {
          console.log(err)
        })
      }
    }
    wx.showToast({
      title: '网络繁忙，请重试',
      icon: "none"
    })
  }
);

// 二次封装 request
function service(config) {
  // showLoading: 部分接口不展示loading弹窗配置，默认展示 TODO: 经测试无效
  const { url, method, params, data, headers = {} } = config;
  let requestUrl = url + (params ? "?" + qs.stringify(params) : "");
  return new Promise((resolve, reject) => {
    request[method](requestUrl, data, {headers})
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {;
        reject(err);
      });
  });
}

export default service;
