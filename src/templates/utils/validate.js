/**
 * 验证工具类
 */

 /**
 * 判断是否为空
 * @param { any } val --- 需要判断的值
 * @return { Boolean }
 */
export function validatenull(val) {
  console.log(val,'val')
  if (typeof val == 'boolean') {
      return false;
  }
  if (typeof val == 'number') {
      return false;
  }
  if (val instanceof Array) {
      if (val.length == 0) {
        return true;
      }
  } else if (val instanceof Object) {
      if (JSON.stringify(val) === '{}') {
        return true;
      }
  } else {
      if (val == 'null' || val == null || val == 'undefined' || val == undefined || val == '') {
        return true;
      }
      return false;
  }
  return false;
}

/**
 * 判断手机号码是否正确
 * @param {string} phone 手机号
 * @return {Array} List 
 * @return { Boolean } list[0] 正确 -- false
 * @return { String } list[1] 错误信息
 */
export function isvalidatemobile(phone) {
  let list = [];
  let result = true;
  let msg = '';
  let isPhone = /^1[3456789]\d{9}$/;
  if (!validatenull(phone)) {
    if (phone.length == 11) {
      if (!isPhone.test(phone)) {
        msg = '手机号码格式不正确'
      } else {
        result = false;
      }
    } else {
      msg = '手机号码长度不为11位'
    }
  } else {
    msg = '手机号码不能为空'
  }
  list.push(result);
  list.push(msg);
  return list;
}