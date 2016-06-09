var config = {
    apiKey: "AIzaSyAvIBhKJushHkr0HbdIevVAtWbZ-k_7dHM",
    authDomain: "easyauction-18f3f.firebaseapp.com",
    databaseURL: "https://easyauction-18f3f.firebaseio.com",
    storageBucket: "easyauction-18f3f.appspot.com",
  };
firebase.initializeApp(config);
ImageDealer.REF = firebase;

var currentUser=null ;
var currentUserid=null ;
var picURL;

var uploadModal = new UploadModal($("#upload-modal"));
var viewModal = new ViewModal($("#view-modal"));
/* i add*/
var fbProvider = new firebase.auth.FacebookAuthProvider();

var currViewer = "";
var nowItem = "";
/* above is I add

/*
    分為三種使用情形：
    1. 初次登入，改變成登入狀態
    2. 已為登入狀態，reload 網站照樣顯示登入狀態
    3. 未登入狀態

    登入/當初狀態顯示可使用下方 logginOption function
*/
firebase.auth().onAuthStateChanged(function(user) {
    console.log("state change enter"+user);
    currentUser=user.displayName;
      if(user!=null){
        logginOption(true);
        firebase.database().ref("Items/").once("value",reProduceAll) ;
      }else{
        logginOption(false);
        
      }
 });

function getItemByURL(suburl) {
  return new Firebase("https://easyauction-18f3f.firebaseio.com/"+suburl);
}

$("#signin").click(function () {
  // 登入後的頁面行為
  
  firebase.auth().signInWithPopup(fbProvider).then(function
  (result) {
   // console.log(firebase.database().ref("Users/"+result.user.displayName));
    firebase.database().ref("Users/"+result.user.uid).update({name:result.user.displayName,ID:result.user.uid,photo:result.user.photoURL,sellItems: null, UserFirstLoginTime:new Date ($.now()).toLocaleString()});
    currentUserid=result.user.uid;
    currentUser=result.user.displayName;

    
  }).catch(function(error) {
    var errorCode = error.code;
    var errorMessa = error.message;
    console.log(errorCode,errorMessa);
  })

});

$("#signout").click(function () {

    // 登出後的頁面行為
    firebase.auth().signOut().then(function() {
      firebase.database().ref("Items/").once("value",reProduceAll) ;
      console.log("click signout");
      logginOption(false);
      currentUser=null ;
      currentUserid=null ;
    },function(error) {
      console.log(error.code);
    });
});


$("#submitData").click(function () {
    // 上傳新商品
  var dataArr = $("#item-info").serializeArray();
  var picFile = $("#picData")[0].files[0];
  if (dataArr[0].value != "" && dataArr[1].value != "" && dataArr[2].value != "" && picFile) {
    //check if it is picture(not yet)
    saveItems(dataArr[0].value, dataArr[1].value, dataArr[2].value);
    console.log("finish submit");
    $("#upload-modal").modal('hide');
  }

});


$("#editData").click(function (a) {
    // 編輯商品資訊
    var dataArr = $("#item-info").serializeArray();
    var picFile = $("#picData")[0].files[0];
    if (dataArr[0].value != "" && dataArr[1].value != "" && dataArr[2].value != "" ) {
      editItems(dataArr[0].value, dataArr[1].value, dataArr[2].value,picFile);
      $("#upload-modal").modal('hide');
    }
});

$("#removeData").click(function () {
    //刪除商品
  removeItems();
  $("#upload-modal").modal('hide');
});




function logginOption(isLoggin) {
  if (isLoggin) {
    $("#upload").css("display","block");
    $("#signin").css("display","none");
    $("#signout").css("display","block");
  }else {
    $("#upload").css("display","none");
    $("#signin").css("display","block");
    $("#signout").css("display","none");
  }
}

firebase.database().ref("Items/").on("value",reProduceAll) ;
function reProduceAll(allItems) {
    /*
    清空頁面上 (#item)內容上的東西。
    讀取爬回來的每一個商品*/
  var allData=allItems.val();
  $("#items").empty();//清空原本#items內的東西
  for(var itemData in allData)//抓取allData中的每一個資料夾(系統命名)
  {
    allData[itemData].itemKey= itemData;
    produceSingleItem(allData[itemData]);
  }
}
// 每點開一次就註冊一次
function produceSingleItem(sinItemData){
  /*
    抓取 sinItemData 節點上的資料。
    若你的sinItemData資料欄位中並沒有使用者名稱，請再到user節點存取使用者名稱
    資料齊全後塞進item中，創建 Item 物件，並顯示到頁面上。
  */
  var item=sinItemData;
//  firebase.database().ref("Items/"+sinItemData+"/").once("value",function (item) {
    var currentUser = firebase.auth().currentUser;
    var thisitem=item;
  //  var thisitem=item.val();

    var product = new Item({"title": thisitem.title, "price": thisitem.price, "itemKey": sinItemData.itemKey, "seller": thisitem.seller, 
    "sellerName":thisitem.sellerName}, currentUser);
    $("#items").append(product.dom);
      /*
        用 ViewModal 填入這筆 item 的資料
        呼叫 ViewModal callImage打開圖片
        創建一個 MessageBox 物件，將 Message 的結構顯示上 #message 裡。
        */
    
    $(product.editBtn).click(function(snapshot){
    //  updateModal(product.dom);
      uploadModal.clear;
    //  console.log("yes"+product.itemKey);
      firebase.database().ref("Items/"+product.itemKey+"/").once("value",function (item) {
             //   console.log( item.val().seller);
        //        console.log( item.val().seller);
                nowItem=product.itemKey;
                uploadModal.callImage(product.itemKey,item.val().seller);
                uploadModal.editData( item.val());
              });
    });
    $(product.viewBtn).click(function(snapshot){
      viewModal.clear;
      firebase.database().ref("Items/"+product.itemKey+"/").once("value",function (item) {
        viewModal.callImage(product.itemKey,thisitem.seller);
        viewModal.writeData( item.val());

      });
   //   console.log(sinItemData.itemKey+"~");
      var messBox = new MessageBox(firebase.auth().currentUser, sinItemData.itemKey); 
      $("#message").append(messBox.dom);
      generateDialog(sinItemData.itemKey, messBox);
        /*
          判斷使用者是否有登入，如果有登入就讓 #message 容器顯示輸入框。
          在 MessageBox 上面註冊事件，當 submit 時將資料上傳。
          */
      
      if (currentUser) 
      {
      
        $("#message").append(messBox.inputBox);
        messBox.inputBox.keypress(function (e) {
          if (e.which == 13) 
          {
            e.preventDefault();
            var userdialog=$(this).find("#dialog").val();
            var currentUserid = firebase.auth().currentUser.uid;
            var currentUserName=firebase.auth().currentUser.displayName;
            firebase.database().ref("Users/"+currentUserid+"/").once("value",function (item) {
                picURL=item.val().photo;
                var message={"message":userdialog, "userTime": new Date().getTime(), "talkerID": currentUserid,"talkerName":currentUserName,"picture":picURL};
                var newmessage = firebase.database().ref("Items/").child(product.itemKey+"/Messages");
                //firebase.database.ref("Items").off();
                newmessage.push(message);
                viewModal.callImage(sinItemData.itemKey,thisitem.seller);

            });            
                
            $(this).find("#dialog").val("");

            }
        });
      }//end if currenUser
      
    });
    /*
    從資料庫中抓出message資料，並將資料填入MessageBox
    */
    

 // });

    /*
    如果使用者有登入，替 editBtn 監聽事件，當使用者點選編輯按鈕時，將資料顯示上 uploadModal。
    */


}
//new Date().getTime()
function generateDialog(diaDatakey, messageBox) {
    
    firebase.database().ref("Items/"+diaDatakey+"/Messages/").orderByChild("userTime").on("value",function(data) {
      messageBox.refresh();
      var messages = data.val()
      for(var messageKey in messages){
        if(messages.hasOwnProperty(messageKey)){
          var singleMessage = messages[messageKey];
          messageBox.addDialog({"message":singleMessage.message, "time": singleMessage.userTime, "name": singleMessage.talkerName,"picURL":singleMessage.picture});
        }
      }
    });
}

/*-------------------------------------------------------------------------*/
function saveItems(title, price, descrip) {
  console.log("upload");
  var currentUserid = firebase.auth().currentUser.uid;
  var currentUserName=firebase.auth().currentUser.displayName;
  var data={"title":title, "price":parseInt(price), "descrip":descrip, "userTime": new Date($.now()).toLocaleString(), "seller": currentUserid,"sellerName":currentUserName};
  var itemID = firebase.database().ref("Items/").push(data).key;
  var updateitem = firebase.database().ref("Users/").child(currentUserid+"/sellItems/"+itemID);
  updateitem.set(data);
  uploadModal._currentItemKey=itemID;
  uploadModal.submitPic(firebase.auth().currentUser.uid);
}


function editItems(title, price, descrip,isNewPic) {
  console.log("edit");
    firebase.database().ref("Items/").child(nowItem).once("value",function (item) {
     uploadModal.upload;
     if(isNewPic!=null)
     {
        uploadModal._currentItemKey=nowItem;
        uploadModal.submitPic(item.val().seller);
     }

    firebase.database().ref("Items/").child(nowItem).update({"title":title, "price":parseInt(price), "descrip":descrip, "userTime":new Date ($.now()).toLocaleString()});
    firebase.database().ref("Users/"+item.val().seller+"/sellItems/").child(nowItem).update({"title":title, "price":parseInt(price), "descrip":descrip, "userTime":new Date ($.now()).toLocaleString()});
    });
  }

function removeItems() {
  console.log(nowItem);
  firebase.database().ref("Items").child(nowItem).once("value",function (item) {
    var userid=item.val().seller;
   // console.log(userid);
    console.log(item.val().seller+"!!!!!!");
    firebase.database().ref("Users/"+userid+"/sellItems/"+nowItem).remove();
    uploadModal._currentItemKey=nowItem;
    uploadModal.deletePic(userid);
  });
  var curr=firebase.database().ref("Items").child(nowItem);
  curr.remove();
}
/*
    商品按鈕在dropdown-menu中
    三種商品篩選方式：
    1. 顯示所有商品
    2. 顯示價格高於 NT$10000 的商品
    3. 顯示價格低於 NT$9999 的商品

*/
$("#SelectPrice li:nth-of-type(1)").click(function (event) {
  firebase.database().ref("Items").once("value",reProduceAll);
});

$("#SelectPrice li:nth-child(2)").click(function (event) {
  firebase.database().ref("Items").orderByChild("price").startAt(10000).once("value",reProduceAll);//排序資料，並抓取10000以上
});

$("#SelectPrice li:nth-of-type(3)").click(function (event) {
  firebase.database().ref("Items").orderByChild("price").endAt(9999).once("value",reProduceAll);//排序資料，並抓取9999以下
});

function viewAllItems() {
  firebase.database().ref("Items").once("value",reProduceAll);
}


$("#upload-modal").on('hidden.bs.modal', function (e) {
  $("#item-info :input").val("");
  $("#picData").val("");
  $("#ModalLabel").text("New Item");
  $("#editData").css("display","none");
  $("#removeData").css("display","none");
  $("#submitData").css("display","inline-block");
});