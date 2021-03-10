// 小程序富文本插件 https://github.com/jin-yufeng/Parser 20201029
var dom;var search;function t(t){for(var e=t.length,i=5381;e--;)i+=(i<<5)+t.charCodeAt(e);return i}var e={},i=require("./libs/MpHtmlParser.js"),n=wx.getFileSystemManager&&wx.getFileSystemManager();Component({options:{pureDataPattern:/^[acdgtu]|W/},data:{nodes:[]},properties:{html:{type:String,observer:function(t){this.setContent(t)}},autopause:{type:Boolean,value:!0},autoscroll:Boolean,autosetTitle:{type:Boolean,value:!0},compress:Number,domain:String,lazyLoad:Boolean,loadingImg:String,selectable:Boolean,tagStyle:Object,showWithAnimation:Boolean,useAnchor:Boolean,useCache:Boolean},relations:{"../parser-group/parser-group":{type:"ancestor"}},created:function(){var t=this;this.imgList=[],this.imgList.setItem=function(t,e){var i=this;if(t&&e){if(0==e.indexOf("http")&&this.includes(e)){for(var s,a="",o=0;(s=e[o])&&("/"!=s||"/"==e[o-1]||"/"==e[o+1]);o++)a+=Math.random()>.5?s.toUpperCase():s;return a+=e.substr(o),this[t]=a}if(this[t]=e,e.includes("data:image")){var r=e.match(/data:image\/(\S+?);(\S+?),(.+)/);if(!r)return;var l=wx.env.USER_DATA_PATH+"/"+Date.now()+"."+r[1];n&&n.writeFile({filePath:l,data:r[3],encoding:r[2],success:function(){return i[t]=l}})}}},this.imgList.each=function(t){for(var e=0,i=this.length;e<i;e++)this.setItem(e,t(this[e],e,this))},dom&&(this.document=new dom(this)),search&&(this.search=function(e){return search(t,e)})},detached:function(){this.imgList.each(function(t){t&&t.includes(wx.env.USER_DATA_PATH)&&n&&n.unlink({filePath:t})}),clearInterval(this._timer)},methods:{in:function(t){t.page&&t.selector&&t.scrollTop&&(this._in=t)},navigateTo:function(t){var e=this;if(!this.data.useAnchor)return t.fail&&t.fail("Anchor is disabled");var i=(this._in?this._in.page:this).createSelectorQuery().select((this._in?this._in.selector:".top")+(t.id?">>>#"+t.id:"")).boundingClientRect();this._in?i.select(this._in.selector).fields({rect:!0,scrollOffset:!0}):i.selectViewport().scrollOffset(),i.exec(function(i){if(!i[0])return e.group?e.group.navigateTo(e.i,t):t.fail&&t.fail("Label not found");var n=i[1].scrollTop+i[0].top-(i[1].top||0)+(t.offset||0);if(e._in){var s={};s[e._in.scrollTop]=n,e._in.page.setData(s)}else wx.pageScrollTo({scrollTop:n});t.success&&t.success()})},getText:function(){for(var t,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.data.nodes,i="",n=0;t=e[n++];)if("text"==t.type)i+=t.text.replace(/&nbsp;/g," ").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");else if("br"==t.type)i+="\n";else{var s="p"==t.name||"div"==t.name||"tr"==t.name||"li"==t.name||"h"==t.name[0]&&t.name[1]>"0"&&t.name[1]<"7";s&&i&&"\n"!=i[i.length-1]&&(i+="\n"),t.children&&(i+=this.getText(t.children)),s&&"\n"!=i[i.length-1]?i+="\n":"td"!=t.name&&"th"!=t.name||(i+="\t")}return i},getVideoContext:function(t){if(!t)return this.videoContexts;for(var e=this.videoContexts.length;e--;)if(this.videoContexts[e].id==t)return this.videoContexts[e]},setContent:function(n,s){var a,o=this,r=new i(n,this.data);if(this.data.useCache){var l=t(n);e[l]?a=e[l]:e[l]=a=r.parse()}else a=r.parse();this.triggerEvent("parse",a);var h={};if(s)for(var c=this.data.nodes.length,d=a.length;d--;)h["nodes["+(c+d)+"]"]=a[d];else h.nodes=a;this.showWithAnimation&&(h.showAm="animation: show .5s"),this.setData(h,function(){o.triggerEvent("load")}),a.title&&this.data.autosetTitle&&wx.setNavigationBarTitle({title:a.title}),this.imgList.length=0,this.videoContexts=[];for(var u,g=this.selectAllComponents(".top,.top>>>._node"),f=0;u=g[f++];){u.top=this;for(var m,p=0;m=u.data.nodes[p++];)if(!m.c)if("img"==m.name)this.imgList.setItem(m.attrs.i,m.attrs["original-src"]||m.attrs.src);else if("video"==m.name||"audio"==m.name){var v;v="video"==m.name?wx.createVideoContext(m.attrs.id,u):u.selectComponent("#"+m.attrs.id),v&&(v.id=m.attrs.id,this.videoContexts.push(v))}}var x;clearInterval(this._timer),this._timer=setInterval(function(){o.createSelectorQuery().select(".top").boundingClientRect(function(t){t&&(o.rect=t,t.height==x&&(o.triggerEvent("ready",t),clearInterval(o._timer)),x=t.height)}).exec()},350)}}})