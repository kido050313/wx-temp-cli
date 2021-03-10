/**
 * 用户登录相关相关服务
 */

 import { getToken, crmToken } from '../api/auth';

 /**
  * Promise封装wx.checkSession
  */
function checkSession() {
  return new Promise(function(resolve, reject) {
    wx.checkSession({
      success () {
        //session_key 未过期，并且在本生命周期一直有效
        resolve(true);
      },
      fail () {
        // session_key 已经失效，需要重新执行登录流程
        resolve(false)
      }
    })
  })
 }

/**
 * Promise封装wx.login
 */

function login() {
  return new Promise(function(resolve, reject) {
    wx.login({
      success: function (res) {
        console.log(res)
        if (res.code) {
            resolve(res);
        } else {
            reject(res);
        }
      },
      fail: function (err) {
          reject(err);
      }
    })
  })
}

/**
 * 判断用户是否登录
 */
function checkLogin() {
  return new Promise(function (resolve, reject) {
      if (wx.getStorageSync('userInfo') && wx.getStorageSync('token')) {
          checkSession().then(() => {
              resolve(true);
          }).catch(() => {
              reject(false);
          });
      } else {
          reject(false);
      }
  });
}

  /**
   * 获取token
   * @param {String} mmberNumber
   */
function checkToken(mmberNumber = wx.getStorageSync('phone')) {
  console.log('get token')
  return new Promise((resolve, reject) => {
      getToken(mmberNumber).then(res => {
        console.log(res)
          wx.setStorageSync('token', res.access_token);
          wx.getSystemInfo({
              success: result => {
                  this.globalData.windowHeight = result.windowHeight
                  this.globalData.windowWidth = result.windowWidth
              },
          })
          resolve()
      })
  })
}

/**
 * 获取crmtoken
 */
function getCrmToken() {
  return new Promise((resolve, reject) => {
    crmToken().then(res => {
      wx.setStorageSync("crm-token", res.data);
      resolve()
    }).catch(() =>{
      reject()
    })
  })
}

module.exports = {
  checkSession,
  checkLogin,
  login,
  checkToken,
  getCrmToken
}
