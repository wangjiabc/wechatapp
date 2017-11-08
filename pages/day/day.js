const p = [];//省
const c = [];//区，县
var riqi;//日期
var val;//下标

const API="https://xcx.360yingketong.com/addons/zjhj_mall/core/web/index.php?store_id=101&r=api/default/cat-list";

Page({
	data: {

	},
	onLoad: function (options) {
         var that=this;
	 wx.request({
             url: API,
             header: {
                 'Content-Type': 'application/json'
             },
             success: function(res) {	
			   var data=res.data.data.list;
               that.setData({
				   dataC:data,
				   isShow: false, // 显示区域选择框
			   });
               var p1=[];
               var c1={};
			   for(var i in data){  
					p1.push(data[i].name);
					var c3=[];
					console.log(data[i].list);
					   for(var j in data[i].list){
						   c3.push(data[i].list[j].name);
						   console.log("name="+data[i].list[j].name);
					   } 
					c1[data[i].name]=c3;
	   			 }  
		 
	
			  console.log(c1);
		 		p.push(p1);//province
				c.push(c1);//city
				that.setData({
			      years: p[0],
				  months: c[0][p[0][0]]
		        })
				console.log(p[0]);
		        console.log(c[0][p[0][0]]);
	        }
    	 });
		 
  },
	bindChange: function (e) {
		var dataC=this.data.dataC;
		console.log(dataC);
		val = e.detail.value;
		console.log(val);
		riqi = this.data;
		var years=riqi.years[val[0]];
		var months=c[0][riqi.years[val[0]]][val[1]];
		console.log(years);
		console.log(months);
        var p0;
		var c0;
		var c0=c[0][p[0][0]][0];
	     for(var i in dataC){  
				if(years==dataC[i].name){
					p0=dataC[i].id;
				 for(var j in dataC[i].list){
                      if(months==dataC[i].list[j].name)
					    c0=dataC[i].list[j].id;
					} 
				}
	   	  }
			


		this.setData({
			months: c[0][riqi.years[val[0]]],
			isShow: true, // 显示区域选择框
			address:years+"--"+months,
			p0:p0,
			c0:c0
		})
	},
	submitForm() {
	  var p0=this.data.p0;
	  var c0=this.data.c0;
	  var address=this.data.address;
	 wx.clearStorage();
	  wx.setStorage({
		  key : 'p0',
		  data : p0
	  });
	  wx.setStorage({
		  key : 'c0',
		  data : c0
	  });
      wx.setStorage({
		  key:'address',
		  data:address
	  })

	  wx.showToast({
 		 title: '设置成功',
		})
		setTimeout(function(){
 		 wx.hideLoading();
		 wx.navigateBack();
	  },2000)

    }
});