const CryptoJS = require("crypto-js");
const area = require("./area");

import { checkToken } from "../utils/user";

/**
 * 格式化时间
 * @param {*} date
 */
const formatTime = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return (
    [year, month, day].map(formatNumber).join("/") +
    " " +
    [hour, minute, second].map(formatNumber).join(":")
  );
};

const formatNumber = (n) => {
  n = n.toString();
  return n[1] ? n : "0" + n;
};

/**
 * 秒转时分
 * @param {Number} number 秒
 */
const formatSecond = (number) => {
  number = Math.round(number);
  const min = Math.floor(number / 60);
  const sec = number % 60;
  return setZero(min) + ":" + setZero(sec);
};

/**
 *  补零函数 || padStart
 * @param {*} number 补零数
 */
const setZero = (number) => {
  if (number < 10) {
    return "0" + number;
  } else {
    return "" + number;
  }
};

/** 数据如果是对象/字符串，处理成数组
 * @param { Number | String | Object } value 被处理的数据
 */ 
const objectToArray = (value) => {
  let arr = [];
  if (!Array.isArray(value)) {
    // 如果是对象模式，只有一组数据
    if( value instanceof Object) {
      arr.push(value)
      return arr;
    }
    // 如果是string,数据为空
    if (value instanceof String) {
      console.log(arr)
      return arr;
    }
  }
  return value;
};

  /** 获取页面栈
   * @param { String } path 需要查找的路径
   * @returns { Number | String } delta 查找的路径在页面栈中的位置
   */
  const getPageDelta = (path) => {
    const pages = getCurrentPages();
    let pageIndex = 0;
     pages.map((item, index) => {
      if(item.route === path) {
        pageIndex = index
      }
    })
    const delta = pages.length - 1 - pageIndex;
    return delta
  }

/** 获取省市区代码
 * @param { Number } areaStep 省市区 0: 省 1：市 2：区
 * @param { String } areaStr 地址名称
 */
const getAreaCode = (areaStep, areaStr) => {
  const { province_list, city_list, county_list } = area.default;
  if (areaStep === 0) {
    // 省 TODO: 重复代码可优化
    for(let item in province_list) {
      if (province_list[item] === areaStr) {
        return item
      }
    }
  } else if (areaStep === 1) {
    // 市
    for(let item in city_list) {
      if (city_list[item] === areaStr) {
        return item
      }
    }
  } else if (areaStep === 2) {
    // 区
    for(let item in county_list) {
      if (county_list[item] === areaStr) {
        return item
      }
    }
  }
}

/** 根据省市区代码查找中文名
  * @param { Number } areaStep 省市区 0: 省 1：市 2：区
 * @param { String } areaCode 地址名称
 */

 const getAreaName = (areaStep, areaCode) => {
  const { province_list, city_list, county_list } = area.default;
  if (areaStep === 0) {
    // 省 TODO: 重复代码可优化,可以使用解构将对象扁平，省去省市区的判断
    for(let item in province_list) {
      if (item === areaCode) {
        return province_list[item]
      }
    }
  } else if (areaStep === 1) {
    // 市
    for(let item in city_list) {
      if (item === areaCode) {
        return city_list[item]
      }
    }
  } else if (areaStep === 2) {
    // 区
    for(let item in county_list) {
      if (item === areaCode) {
        return county_list[item]
      }
    }
  }
 }

/** 节流函数
 * @param {function } func 方法
 * @param {Number} wait 时间间隔
 */
function throttle(func, wait) {
  let timeout = 0
  return function throttled(...args) {
    const ctx = this
    // 如果已经是定时器定时阶段，则直接跳过，相当于忽略了触发
    // 必须等到定时器到时间之后
    if (!timeout) {
      timeout = setTimeout(() => {
        func.apply(ctx, args)
        timeout = null
      }, wait)
    }
  }
}

/** 防抖函数
 * @param {function } func 方法
 * @param {Number} wait 时间间隔
 */
function debounce (fn, delay = 200) {
  let timeout;
  return function() {
    // 如果 timeout == null 说明是第一次，直接执行回调，否则重新计时
    timeout == null ? fn.call(this, ...arguments) : clearTimeout(timeout);
    timeout = setTimeout(fn.bind(this), delay, ...arguments);
  }
}

/** 根据生日获得年龄
 * @param { String } strBirthday 生日 格式：YYYY-MM-DD
 */
function formatAge(strBirthday) {
  let returnAge = '';
  let mouthAge = '';
  let strBirthdayArr = strBirthday.split("-");
  let birthYear = strBirthdayArr[0];
  let birthMonth = strBirthdayArr[1];
  let birthDay = strBirthdayArr[2];
  let d = new Date();
  let nowYear = d.getFullYear();
  let nowMonth = d.getMonth() + 1;
  let nowDay = d.getDate();
  // 小于1岁显示月，小于月显示天，大于1岁不显示月天
  if (nowYear == birthYear) {
    let monthDiff = nowMonth - birthMonth;
    console.log(monthDiff)
    if (monthDiff <= 0) {
      let dayDiff = nowDay - birthDay; //日之差 
      if (dayDiff <= 0) {
        return returnAge = '1天'
      }
      return returnAge = dayDiff + '天'; // 返回天数
    }
    return monthDiff < 10? '0' + monthDiff + '月' : monthDiff + '月'; // 返回月份
  }
  
  let age = nowYear - birthYear;
  if(age < 0) {
    return '0岁'
  }
  let fullAge = parseInt((age * 12 + nowMonth - birthMonth ) / 12 )
  let fullMonth = (age * 12 + nowMonth - birthMonth ) % 12
  // return age + '岁';  // 返回周岁
  if (nowMonth == birthMonth) {
    if (nowDay > birthDay) {
      return fullAge + '岁01月'
    }else if(nowDay < birthDay) {
      return fullAge <= 1? '11月' : fullAge - 1 + '岁' + '11月'
    }else {
      return fullAge + '岁'
    }
  }
  return fullAge === 0? (fullMonth < 10? '0' + fullMonth + '月' : fullMonth + '月') : (fullAge + '岁' + (fullMonth < 10? '0' + fullMonth + '月' : fullMonth + '月'));  // 天数修改，精度为月
}

/**
 * des加密
 * @param { string } message 加密内容
 * @param { string } key 加密秘钥
 */
function desEncrypt(message, key) {
  let keyHex = CryptoJS.enc.Utf8.parse(key);
  let encrypted = CryptoJS.DES.encrypt(message, keyHex, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString();
}

/** 文件上传函数
 * @param { Object } file 上传本地读取到的文件
 * @param { Object } header 请求头，此处为了避免上传地址不同时可做不同的配置
 */
const upload = async function (url, file, header = {}) {
  wx.showLoading({
    title: "上传中...",
  });
  // 当设置 mutiple 为 true 时, file 为数组格式，否则为对象格式
  return await new Promise((resolve, reject) => {
    wx.uploadFile({
      url: url, // 仅为示例，非真实的接口地址
      filePath: file.url,
      name: "file",
      formData: {
        user: "test",
      },
      header: header,
      success: (res) => {
        wx.hideLoading();
        // TODO: 根据接口返回值进行修改
        if (res.statusCode === 401) {
          console.error("用户身份过期，将自动刷新Token！");
          // TODO：此处目前会引起死循环，需修改
          checkToken().then(() => {
            this.upload(url, file, header);
          });
        }
        if (res.statusCode === 200) {
          resolve(res);
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.log(err, "err");
        reject(err);
      },
    });
  });
};

module.exports = {
  formatTime: formatTime,
  formatSecond,
  desEncrypt,
  upload,
  throttle,
  debounce,
  formatAge,
  objectToArray,
  getPageDelta,
  getAreaCode,
  getAreaName,
  setZero
};
