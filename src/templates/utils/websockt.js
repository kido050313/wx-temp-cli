/** webSocket相关方法 */

/** webSocket心跳重连方法 */
export const heartCheck = {
  timeout: 10000,   // 心跳对象内timeout为每10秒发一次心跳
  timeoutObj: null,
  serverTimeoutObj: null,
  /** 重置定时器 */
  reset: function () {
    clearTimeout(this.timeoutObj);
    clearTimeout(this.serverTimeoutObj);
    return this;
  },
  /** 发送心跳 */
  start: function () {
    this.timeoutObj = setTimeout(()=> {
      // console.log("发送ping");
      wx.sendSocketMessage({
        data:"ping",
        success(){
          console.log("发送ping成功");
        }
      });
      this.serverTimeoutObj = setTimeout(() =>{
        wx.closeSocket(); 
      }, this.timeout);
    }, this.timeout);
  }
};