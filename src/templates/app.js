//app.js
import {
  crmToken,
  getToken,
  getMiniOpenId,
  getHypUser,
  userUpdate,
  getCustomerInfo,
  registRequest,
  getCustomerInfoByOpenId,
  getHealthySetting,
  loginByToken,
} from "./api/auth";
import { wechatBinding } from "./api/lottery"
import { COMPANY_ID, ORIGIN, APPID, MEMBERUSER } from "./api/config";
import { validatenull } from "./utils/validate";
import { getTaskList, finishTask } from './api/task';

const utilMd5 = require("./utils/md5.js");
const util = require("./utils/util.js");
const QQMapWX = require("/libs/qqmap-wx-jssdk"); // 腾讯位置服务sdk
var qqmapsdk;

App({
  onLaunch: function () {
    const updateManager = wx.getUpdateManager();
    updateManager.onUpdateReady(function () {
      // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
      updateManager.applyUpdate();
      wx.clearStorageSync();
      // 如果之前没有清除缓存，更新版本时清除本地缓存，这是为了解决20201228版本数据错乱影响的用户的
      // if(!wx.getStorageSync("isNewUpdated")) {
        // wx.clearStorageSync();
      //   wx.setStorageSync("isNewUpdated", true)
      // }
    });

    wx.getSystemInfo({
      success: (result) => {
        this.globalData.system = result;
        this.globalData.windowHeight = result.windowHeight;
        this.globalData.windowWidth = result.windowWidth;
      },
    });
    // 获取胶囊信息
    this.globalData.capsule = wx.getMenuButtonBoundingClientRect();

    // 已经登录
    if(this.hasLogined()) {
      // 每次进入都获取一次用户信息，刷新本地用户数据，并且检查用户是否被冻结
      this.getUserInfo()
    }
   },

  onShow: function () {
    console.log("app.onshow")

    // 拦截冻结，TODO： onlaunch中的冻结拦截是否可以与此处合并
    if(this.hasLogined()) {
      if(this.globalData.isFreezing) {
        // TODO: 考虑清除所有缓存还是用户数据缓存
        // wx.removeStorageSync("userInfo");
        wx.switchTab({
          url: `/pages/index/index`
        })
      }
      // 如果用户为临时冻结状态,拦截到首页
      if(this.globalData.isTemporaryFreezing && !this.globalData.noNeedTemporaryFreezingRedirect) {
        wx.switchTab({
          url: `/pages/index/index`
        })
      }
    }
  },

  /** 冻结用户拦截跳转 */
  // async freezingRedirect() {
  //   try {
  //     console.log("冻结拦截请求")
  //     const result = await this.getUserInfo();
  //     // 如果没有用户数据且已经为永久冻结状态
  //     console.log(result)
  //     console.log(this.globalData)
  //     if(!result && this.globalData.isFreezing) {
  //       // TODO: 考虑清除所有缓存还是用户数据缓存
  //       wx.removeStorageSync("userInfo");
  //       wx.switchTab({
  //         url: `/pages/index/index`
  //       })
  //     }
  //     // 如果用户为临时冻结状态,拦截到首页
  //     if(this.globalData.isTemporaryFreezing) {
  //       console.log(this.globalData.isTemporaryFreezing)
  //       wx.switchTab({
  //         url: `/pages/index/index`
  //       })
  //     }
  //   } catch (error) {
  //     console.log("freezing error")
  //     console.log(error)
  //   }
  // },

  /** 健康咨询配置 */
  healthySetting() {
    return new Promise((resolve, reject) => {
      getHealthySetting().then(res => {
        if(res.code === 200) {
          //  data: true隐藏， healthy， true显示
          let healthyShow = !res.data
          wx.setStorageSync("healthyShow", healthyShow)
          resolve(res)
        }
        else {
          reject()
        }
      })
    })
  },

  /** 根据用户信息是否有手机号判断是否已经登录
   * @return false 未登录 true 已登录
   */
  hasLogined() {
    const userInfo = wx.getStorageSync("userInfo");
    if (validatenull(userInfo.memberNumber)) {
      return false;
    }
    return true;
  },

  /** 登录拦截方法 */
  redirectToLogin() {
    const userInfo = wx.getStorageSync("userInfo");
    // 记录首次进入的页面路径
    let pages = getCurrentPages();
    let currentPage = pages[pages.length - 1].route;
    let options = pages[pages.length - 1].options;
    if (validatenull(userInfo.memberNumber)) {
      this.globalData.originPage = currentPage;
      this.globalData.pageQuery = options;
      console.log(this.globalData)
      wx.switchTab({
        url: '/pages/index/index'
      })
      return;
    }
  },

  /** 获取用户信息
   * modify by lmy === 2021/01/18
   */
  async getUserInfo() {
    try {
      const result = await loginByToken();
      // 登录成功
      if (result.code === 200) {
        wx.setStorageSync("userInfo", result.data)
        this.globalData.userInfo = result.data;
        this.globalData.isLogined = true;
        this.globalData.isFreezing = false;
        // 判断用户临时冻结
        this.globalData.isTemporaryFreezing = result.data.isTemporaryFreezingMember
        // 如果用户为临时冻结状态,拦截到首页
        if(this.globalData.isTemporaryFreezing) {
          wx.switchTab({
            url: `/pages/index/index`
          })
        }
        wx.setStorageSync("phone", result.data.memberNumber);
        return true;
      } else if (result.code === 10002) {
        // 永久冻结用户
        this.globalData.isFreezing = true;
        if(this.globalData.isFreezing) {
          wx.switchTab({
            url: `/pages/index/index`
          })
        }
        // wx.removeStorageSync("userInfo")
        // 此处的提示放在首页，冻结弹窗处提示
        return false;
      } else {
        wx.showToast({
          title: result.msg,
          icon: 'none'
        });
        wx.removeStorageSync("userInfo")
        return false;
      }
    } catch (error) {
      console.log(error)
      return false;
    }
  },

  /**
   * 获取crmtoken
   */
  getCrmToken() {
    return new Promise((resolve, reject) => {
      crmToken()
        .then((res) => {
          if (res.code === 200) {
            wx.setStorageSync("crm-token", res.data);
            resolve();
          } else {
            wx.showToast({
              title: "获取token失败，请退出重试",
              icon: "none",
            });
            reject();
          }
        })
        .catch(() => {
          reject();
        });
    });
  },

  /**
   * 获取token
   * @param {String} memberNumber
   */
  async getToken(memberNumber = wx.getStorageSync("userInfo").memberNumber) {
    try {
      return new Promise((resolve, reject) => {
        getToken(memberNumber).then((res) => {
          console.log(res);
          wx.setStorageSync("token", res.access_token);
          resolve(res);
        });
      });
    } catch (err) {
      console.log(err);
    }
  },

  /**
   * 获取code 
   */
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        timeout: 10000,
        success: (res) => {
          console.log(res)
          if(res.code) {
            console.log(res.code)
            resolve(res.code);
          } else {
            wx.showToast({
              title: res.msg,
              icon: 'none'
            })
            reject();
          }
        },fail: () => {
          wx.showToast({
            title: "网络异常，请检查您的网络连接",
            icon: "none",
            mask: false,
          });
          reject();
        },
      })
    })
  },

  /**
   * 获取openId
   * @param {String} code
   * modify by lmy === 2021/01/18
   */
  async loginByWeixin() {
    try {
      const code = await this.wxLogin();
      const res = await getMiniOpenId({code});
      if (res.code === 200 && !validatenull(res.data.openid)) {
        wx.setStorageSync("openId", res.data.openid);
        wx.setStorageSync("unionId", res.data.unionid);
        wx.setStorageSync("phone", res.data.memberNumber);
        return res;
      } else {
        wx.showToast({
          title: res.msg || '登录失败！请重试',
          icon: 'none'
        })
      }
      // getMiniOpenId({ code })
      //   .then((res) => {
      //     console.log(res)
      //     if (res.code === 200 && !validatenull(res.data.openid)) {
      //       wx.setStorageSync("openId", res.data.openid);
      //       wx.setStorageSync("unionId", res.data.unionid);
      //       wx.setStorageSync("phone", res.data.memberNumber);
      //       return res;
      //     } else {
      //       wx.showToast({
      //         title: res.msg || '登录失败！请重试',
      //         icon: 'none'
      //       })
      //     }
      //   }).catch((err) => {
      //     console.log(err)
      //     wx.showToast({
      //       title: "登录失败！请重试",
      //       icon: 'none'
      //     });
      //   });
    } catch (error) {
      console.log(error)
      wx.showToast({
        title: error.msg || '登录失败，请重试！',
        icon: 'none'
      })
    }
  },

  /**
   * 获取用户信息
   * @param {string} phone 手机号
   */
  async flushUserInfo(phone) {
    const requestData = `<?xml version="1.0" encoding="utf-8"?>
    <userQueryInfo>
    <companyId>${COMPANY_ID}</companyId>
    <userName>${phone}</userName>
    <appId>${APPID}</appId>
    </userQueryInfo>`;
    console.log(requestData)
    const res = await getCustomerInfo(requestData);
    console.log(JSON.parse(res.responseData))
    const { userInfo } = JSON.parse(res.responseData);
    console.log(userInfo)
    console.log(userInfo.result)  
  },

  /** 绑定用户appid和openid
   * @param {String} openid
   */
  async openIdBinding(openid = wx.getStorageSync("openId")) {
    console.log(openid);
    const userInfo = wx.getStorageSync("userInfo");
    const union_id = wx.getStorageInfoSync("unionId");
    const params = `<?xml version="1.0" encoding="utf-8"?>
                    <userRegister>
                    <accflg>${COMPANY_ID}</accflg>
                    <openId>${openid}</openId>
                    <appId>${APPID}</appId>
                    ${union_id ? `<unionId>${union_id}</unionId>` : ""}
                    <origin>${ORIGIN}</origin>
                    <userPassword>${userInfo.password}</userPassword>
                    <userType>${MEMBERUSER}</userType>
                    <username>${userInfo.user_name}</username>
                    </userRegister>`;
    console.log(params)
    const result = await wechatBinding(params);
    console.log(result);
    return result;
  },

  /**
   * 新会员注册
   * @param { string|| number } phone 手机号
   */
  async regist(phone) {
    const nowDate = util.formatTime(new Date()).split(" ")[0];
    const month = nowDate.split("/")[1];
    const date = nowDate.split("/")[2];
    const password = phone + month + date;
    const openId = wx.getStorageSync("openId");
    // 注册接口origin与别的接口不同，请注意
    const requestData = `<?xml version="1.0" encoding="utf-8"?>
                              <register>
                              <company_id>${COMPANY_ID}</company_id>
                              <member_no>${phone}</member_no>
                              <password>${utilMd5.hexMD5(password)}</password>
                              <user_type>${MEMBERUSER}</user_type>
                              <origin>weixin_1897_origin</origin>
                              <app_id>${APPID}</app_id>
                              <open_id>${openId}</open_id>
                              </register>`;
    console.log(requestData)
    const res = await registRequest(requestData);

    const { msg, result, ...returnInfo } = JSON.parse(res.responseData).registerOutput;
    console.log(JSON.parse(res.responseData).registerOutput)
    console.log(result)
    // 注册成功 || 已经注册过E0009
    if (result === "S0003") {
      // 新会员标记
      this.globalData.isNewMember = true;
      await this.flushUserInfo(phone);
      // 同步信息更新到1897后台
      const userInfo = wx.getStorageSync("userInfo");
      await this.updateHypUserInfo(userInfo);
      return true;
    } else if (result === "E0009") {
      await this.flushUserInfo(phone);
      const userInfo = wx.getStorageSync("userInfo");
      // 同步信息更新到1897后台
      await this.updateHypUserInfo(userInfo);
      return true;
    } else {
      wx.showToast({
        title: msg || "请求失败，请重试",
        icon: "none",
        mask: false,
      });
      wx.removeStorageSync("userInfo")
      wx.removeStorageSync("hpy-userInfo");
      return false;
    }
  },


  /** 获取地理位置授权 */
  getSetting() {
    return new Promise((resolve, reject) => {
      const that = this;
      wx.getSetting({
        success: (res) => {
          // res.authSetting['scope.userLocation'] == undefined    表示 初始化进入该页面
          // res.authSetting['scope.userLocation'] == false    表示 非初始化进入该页面,且未授权
          // res.authSetting['scope.userLocation'] == true    表示 地理位置授权
          if (
            res.authSetting["scope.userLocation"] != undefined &&
            res.authSetting["scope.userLocation"] != true
          ) {
            wx.showModal({
              title: "请求授权当前位置",
              content: "需要获取您的地理位置，请确认授权",
              success: function (res) {
                if (res.cancel) {
                  wx.showToast({
                    title: "拒绝授权",
                    icon: "none",
                    duration: 1000,
                  });
                  resolve(false);
                } else if (res.confirm) {
                  wx.openSetting({
                    success: function (dataAu) {
                      if (dataAu.authSetting["scope.userLocation"] == true) {
                        wx.showToast({
                          title: "授权成功",
                          icon: "success",
                          duration: 1000,
                        });
                        //再次授权，调用wx.getLocation的API
                        that.getLocation().then((res) => {
                          resolve(true);
                        }).catch(err => {
                          console.log(err)
                          resolve(false)
                        })
                      } else {
                        wx.showToast({
                          title: "授权失败",
                          icon: "none",
                          duration: 1000,
                        });
                      }
                      resolve(false);
                    },
                  });
                }
              },
            });
          } else {
            console.log("地理位置授权")
            //调用wx.getLocation的API
           return this.getLocation().then((res) => {
              resolve(true);
            }).catch(err => {
              console.log(err)
              resolve(false)
            })
            // resolve(true)
          }
        },
      });
    });
  },

  /** 获取用户地理位置 */
  getLocation() {
    return new Promise((resolve, reject) => {
      // 腾讯位置服务sdk key
      qqmapsdk = new QQMapWX({
        key: "HCPBZ-P5P3P-QPXD4-VXWSB-HW3M2-E7B6O",
      });
      wx.showLoading({
        title: '获取定位中...'
      })
      // 获取当前位置
      wx.getLocation({
        type: "gcj02",
        isHighAccuracy: true,
        highAccuracyExpireTime: 4000,
        success: (res) => {
          console.log(res)
          const { latitude, longitude, speed, accuracy } = res;
          qqmapsdk.reverseGeocoder({
            location: { latitude, longitude },
            coord_type: 5, // 输入的locations的坐标类型，可选值为[1,6]之间的整数，每个数字代表的类型说明：
            // 1 GPS坐标
            // 2 sogou经纬度
            // 3 baidu经纬度
            // 4 mapbar经纬度
            // 5 [默认]腾讯、google、高德坐标
            // 6 sogou墨卡托
            success: (res) => {
              console.log(res)
              const { address, address_component, ad_info } = res.result;
              const { city, province, district } = address_component;
              const { adcode } = ad_info;
              const province_code = util.getAreaCode(0, province) || '';
              const city_code = util.getAreaCode(1, city) || adcode; // 如果有
              const area_code = adcode;
              // 存储当前位置
              this.globalData.location = {
                address,
                province,
                city,
                province_code,
                district,
                area_code,
                city_code,
                latitude,
                longitude,
              };
              console.log(this.globalData.location);
              wx.hideLoading();
              resolve(true);
            },
            fail: (err) => {
              wx.hideLoading();
            }
          });
        },
        fail: (err) => {
          console.log(err);
          wx.hideLoading();
          reject(err);
        },
      });
    });
  },

  /** 是否已完善信息 */
  isFinishInfo() {
    // 根据1897返回的memberInfoFinishedFlag字段判断：1已完成，0未完成
    const memberInfoFinishedFlag = wx.getStorageSync("userInfo").memberInfoFinishedFlag;
    console.log(memberInfoFinishedFlag)
    console.log(memberInfoFinishedFlag == 1);
    if (memberInfoFinishedFlag == 1) {
      return true;
    }
    return false;
  },

  /** 未完善信息拦截跳转 */
  toCompleteInfo(isTab = false) {
    console.log(isTab)
    // if(!isTab) { // 忘了为什么要这样判断了，后续遇到问题看看 modify:lmy
      wx.navigateTo({
        url: '/pages/completeInfo/index?isFlag',
      })
      return false;
    // } else {
    //   wx.redirectTo({
    //     url: '/pages/completeInfo/index?isFlag',
    //   })
    // }
    
  },

  /** 判断是不是tabbar页面
   * @param {String} page 页面
  */
  isTabbarPage(page) {
    const tabbarPage = [
      "pages/index/index",
      "pages/pointsMall/index",
      "pages/rightCenter/index",
      "pages/mine/index"
    ];
    console.log(tabbarPage.indexOf(page))
    if(tabbarPage.indexOf(page) > -1) {
      return true
    } else {
      return false;
    }
  },

  /** 别的页面跳转过来成功登录后跳转回去 */
  redirectOriginPage() {
    // 如果是tabbar页面
    if (this.globalData.originPage) {
      // 别的页面为进入首页，直接跳转回去
      let query = ""; // 参数
      console.log("跳转回去")
      if (!validatenull(this.globalData.pageQuery) && Object.keys(this.globalData.pageQuery).length) {
        let queryArr = Object.entries(this.globalData.pageQuery).map((item) => {
          return `${item[0]}=${item[1]}`;
        });
        query = `?${queryArr[0]}&${queryArr[1]}`;
      }
      console.log(`/${this.globalData.originPage}${query}`)
      const tabbarPage = this.isTabbarPage(this.globalData.originPage);
      console.log(tabbarPage)
      this.globalData.fromIndex = true;
      if(tabbarPage) {
        wx.switchTab({
          url: `/${this.globalData.originPage}${query}`,
        })
        return;
      }
      
      wx.navigateTo({
        // TODO: 测试如果不加/是否可以跳转
        url: `/${this.globalData.originPage}${query}`,
      });
      this.removeOriginPage();
      return;
    }
  },

  /** 跳转成功后清空originpage */
  removeOriginPage() {
    this.globalData.originPage = "";
    this.globalData.pageQuery = "";
    console.log(this.globalData)
  },

  /**
   * 获取任务列表
   */
  getTaskList() {
    getTaskList().then(res => {
      // taskPointStatus: 任务已完成, 积分领取状态,可用值:RECEIVED,UN_RECEIVED
      // taskStatus: 任务完成状态,可用值:FINISHED,UN_FINISHED
      if (res.code === 200) {
        wx.setStorageSync('taskObject', res.data)
      }
    })
  },

  /**
   * 完成任务
   * @param {Number} taskId 任务id
   * @param {Boolean} isTimeLimit 是否是限时任务
   */
  async finishTask(taskId, isTimeLimit = true) {
    const taskObject = wx.getStorageSync('taskObject')
    // 会员注册时间
    const createTime = taskObject.memberRegisterUnixTimestamp * 1000
    // 接口返回的当前时间
    const currentTime = taskObject.currentUnixTimestamp * 1000
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    let taskList = []
    if (isTimeLimit) {
      // 限时任务列表
      taskList = taskObject.dayToTask[30]
    } else {
      // 晋升会员
      taskList = taskObject.dayToTask[-1]
    }
    const status = {
      unFinish: 'UN_FINISHED',
      finished: 'FINISHED'
    }
    let currentTask
    taskList.map(item => {
      if (item.taskId === taskId) {
        currentTask = item
      }
    })
    const taskStartTime = currentTask.taskReleaseUnixTimestamp
    if (isTimeLimit && currentTask.taskStatus === status.unFinish) {
      // 限时任务需在有效期内
      if (createTime >= taskStartTime && (createTime + thirtyDays) >= currentTime) {
        await finishTask(status.finished, currentTask.taskId)
        this.getTaskList()
      } else if (createTime < taskStartTime && (taskStartTime + thirtyDays) >= currentTime) {
        await finishTask(status.finished, currentTask.taskId)
        this.getTaskList()
      }
    }
    // 非限时任务不需要计算有效期
    if (!isTimeLimit && currentTask.taskStatus === status.unFinish) {
      await finishTask(status.finished, currentTask.taskId)
      this.getTaskList()
    }
  },

  globalData: {
    system: {}, // 系统信息
    capsule: '', // 胶囊信息
    windowHeight: 0,
    windowWidth: 0,
    originPage: '', // 第一次进入的页面路径（不是首页的时候）
    pageQuery: {}, // 第一次进入的页面路径携带的参数（不是首页的时候）
    prevPage: '', // 被拦截进入完善信息的页面路径
    appId: "",
    appSecret: "",
    userInfo: {},
    storeCode: "", // 自助积分选择的门店id
    lotteryRecords: [], // 自助积分记录
    location: {}, // 位置信息
    isNewMember: false, // 是否新会员
    isLogined: false, // 是否已经登录
    isFreezing: false, // 是否被冻结用户 true，被冻结， false: 未被冻结
    isTemporaryFreezing: false, // 临时冻结用户
    noNeedTemporaryFreezingRedirect: false, // onshow不需要添加冻结拦截标志
    hasToIndex: false, // 已经跳转到首页
    fromIndex: false, // 登录重新跳到那个页面
  },
});
